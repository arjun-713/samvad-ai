# Samvad AI - System Design Document

## 1. Architecture Overview

Samvad AI is a cloud-native, microservices-based platform that transforms live video streams into accessible content with <2s latency.

### High-Level Pipeline

```
Live Stream → Audio Extraction → Speech-to-Text → Translation
                                                        ↓
                                    ┌──────────────────┴──────────────────┐
                                    ↓                                      ↓
                            ISL Grammar → Avatar                    Voice Dubbing
                                    ↓                                      ↓
                                    └──────────────────┬──────────────────┘
                                                       ↓
                                    Stream Multiplexing → CDN → Users
```

### Design Principles

- **Microservices**: Independent, scalable services
- **Event-driven**: Async communication via message queues
- **Stateless**: All services horizontally scalable
- **Real-time**: Chunk-based streaming processing
- **Fault-tolerant**: Graceful degradation on failures

---

## 2. System Components

### Ingestion Service
- Accepts RTMP, WebRTC, HLS streams
- Extracts audio and splits into 2-second chunks
- Publishes chunks to message queue
- **Tech**: NGINX-RTMP, FFmpeg, Kafka

### Speech Recognition Service
- Converts audio to text with timestamps
- Supports 10+ Indian languages and accents
- Speaker diarization and punctuation
- **Tech**: Whisper/IndicWav2Vec, GPU inference (T4/A10)
- **Latency**: <500ms per chunk

### Transcreation Engine
- Translates text with cultural adaptation
- Preserves idioms, metaphors, and context
- Handles code-switching (English-Hindi mixing)
- **Tech**: mT5, IndicTrans2, Redis cache
- **Latency**: <300ms per chunk

### ISL Grammar Converter
- Transforms text to ISL grammatical structure
- Generates gloss notation for avatar
- Adds non-manual markers (facial expressions)
- **Tech**: Custom seq2seq model, rule-based engine
- **Latency**: <200ms per sentence

### Avatar Generation Engine
- Renders photorealistic 3D ISL avatar
- 60 FPS with smooth sign transitions
- Facial animation synchronized with signs
- **Tech**: Unity/Unreal, GPU rendering (RTX A5000)
- **Latency**: <800ms per chunk

### Audio Dubbing Engine
- Neural voice synthesis with cloning
- Matches original speaker's tone and emotion
- Supports 10+ Indian languages
- **Tech**: VITS/Coqui TTS, GPU inference
- **Latency**: <400ms per chunk

### Stream Multiplexer
- Synchronizes avatar, audio, and subtitles
- Generates HLS/DASH adaptive streams
- Maintains <100ms sync accuracy
- **Tech**: FFmpeg, WebRTC
- **Latency**: <200ms

### CDN Layer
- Distributes streams globally with edge caching
- Multi-CDN strategy (Cloudflare, AWS CloudFront)
- <200ms latency within India
- **Tech**: HLS/DASH, HTTP/3

---

## 3. Data Flow

### Step-by-Step Pipeline

1. **Ingestion** (50ms)
   - Extract audio from live stream
   - Normalize to 16kHz mono PCM
   - Split into 2s chunks with 500ms overlap

2. **Speech Recognition** (400ms)
   - Convert audio chunk to text
   - Add punctuation and timestamps
   - Detect source language

3. **Transcreation** (250ms)
   - Translate to target language(s)
   - Adapt cultural references
   - Preserve context from previous chunks

4. **Parallel Processing** (900ms max)
   - **Path A**: ISL Grammar (150ms) → Avatar Rendering (750ms)
   - **Path B**: Voice Dubbing (350ms)
   - Both paths run concurrently

5. **Multiplexing** (150ms)
   - Sync all output tracks
   - Generate HLS/DASH segments
   - Publish to CDN origin

6. **Delivery** (100ms)
   - CDN edge serves to users
   - Adaptive bitrate based on network

**Total Latency**: ~1.8s (within 2s target)

### Chunk Processing Strategy

- **Chunk size**: 2 seconds (balance between latency and context)
- **Overlap**: 500ms to prevent word cutoff
- **Ordering**: Chunks tagged with stream_id, chunk_id, timestamp
- **Failure handling**: Skip failed chunks after 3 retries, continue stream

---

## 4. Infrastructure Design

### Cloud Architecture

**Compute**:
- **Kubernetes (EKS/GKE)**: Container orchestration
- **GPU instances**: Avatar rendering, ASR, dubbing (T4, A10, RTX)
- **CPU instances**: Transcreation, multiplexing (Fargate/Cloud Run)
- **Serverless**: API gateway, webhooks (Lambda/Cloud Functions)

**Storage**:
- **Redis**: Session state, context windows (1-hour TTL)
- **S3/GCS**: HLS segments, transcripts (7-day retention)
- **PostgreSQL**: User data, stream metadata

**Messaging**:
- **Kafka**: Inter-service communication, chunk queues
- **Partitioning**: By stream_id for ordering guarantees

**CDN**:
- **Multi-CDN**: Cloudflare (primary), AWS CloudFront (secondary)
- **Edge locations**: Mumbai, Delhi, Bangalore, Hyderabad
- **Caching**: 2s TTL for live segments

### Auto-Scaling Strategy

**Horizontal Pod Autoscaler**:
- Scale based on GPU/CPU utilization (target: 70%)
- Queue depth monitoring (Kafka lag)
- Min replicas: 2 per service (redundancy)
- Max replicas: 100 per service

**Cluster Autoscaler**:
- Add nodes when pods pending
- Remove nodes at <50% utilization for 10 minutes
- Separate node pools: CPU-optimized, GPU-optimized

**Predictive Scaling**:
- Pre-scale before expected traffic spikes
- Historical pattern analysis (time of day, events)

### Multi-Region Setup

- **Primary**: Mumbai (India West)
- **Secondary**: Bangalore (India South)
- **Failover**: Automatic DNS routing on regional failure
- **RTO**: 15 minutes, **RPO**: 5 minutes

---

## 5. Performance Strategy

### Latency Reduction

**Model Optimization**:
- Quantization: FP32 → FP16 → INT8 (2-4x speedup)
- Model pruning and distillation
- ONNX Runtime for optimized inference
- TensorRT for NVIDIA GPU acceleration

**Caching**:
- L1 (In-memory): Models, common phrases (2-4 GB per instance)
- L2 (Redis): Transcripts, translations, avatar segments (1-hour TTL)
- L3 (CDN): HLS segments (2s TTL for live)

**Pre-Warming**:
- Maintain 2+ always-on instances per service
- Models pre-loaded in memory
- Predictive scaling before traffic spikes
- Shared EFS/Filestore for model caching

**Parallel Execution**:
- ISL and dubbing paths run concurrently
- GPU batching: Process 4-16 streams per GPU
- Pipeline parallelism: Overlap processing stages
- Async I/O for non-blocking operations

**Network Optimization**:
- HTTP/2 multiplexing
- Brotli compression for text
- Regional endpoints to reduce RTT
- Connection pooling

### Bottleneck Mitigation

- **Avatar rendering** (slowest at 750ms):
  - Pre-rendered sign library (5000+ signs)
  - Level-of-detail (LOD) rendering
  - Hardware encoding (NVENC)
  - Fallback to text-only if >2s

---

## 6. Security Considerations

### Data Protection

**Encryption**:
- TLS 1.3 for all API traffic
- AES-256 for data at rest (S3, database)
- DTLS-SRTP for WebRTC media streams
- AWS KMS/GCP Cloud KMS for key management

**Authentication & Authorization**:
- OAuth 2.0 for user authentication
- JWT tokens (1-hour expiry)
- API keys for service-to-service communication
- Role-based access control (RBAC)

### Network Security

- VPC isolation for services
- Private subnets for databases
- Security groups: Whitelist required ports only
- Service mesh (Istio) with mTLS between microservices

### API Security

- Rate limiting: 100 req/min per user
- Input validation and sanitization
- CORS policies (whitelist origins)
- DDoS protection via Cloudflare

### Privacy

- No audio/video storage beyond processing
- Anonymized data for analytics
- GDPR and Indian data protection compliance
- User data deletion within 30 days on request

### Compliance

- WCAG 2.1 Level AA accessibility
- SOC 2 Type II certification
- ISO 27001 (information security)
- Regular security audits and penetration testing

---

## 7. Future Improvements

### Short-Term (3-6 months)

- **Dialect support**: Regional ISL variations (North vs South)
- **Mobile SDK**: Native iOS/Android integration
- **Offline mode**: Pre-downloaded models for low connectivity
- **Analytics dashboard**: Creator insights on accessibility usage

### Medium-Term (6-12 months)

- **Personal avatars**: User-uploaded photos for custom avatars
- **Reverse mode**: Sign-to-speech for deaf creators
- **AR overlays**: Augmented reality avatar integration
- **Interactive learning**: Sign language education mode

### Long-Term (12+ months)

- **Global expansion**: Support for ASL, BSL, other sign languages
- **Multi-camera support**: Complex sign language from multiple angles
- **Edge AI**: Deploy lightweight models at edge locations
- **Community platform**: User-contributed sign dictionaries
- **Enterprise features**: White-label solutions, API marketplace

### Technical Debt

- Migrate to gRPC for inter-service communication (lower latency)
- Implement GraphQL API for flexible client queries
- Add A/B testing framework for model improvements
- Build ML pipeline for continuous model retraining
- Implement feature flags for gradual rollouts

---

**Version**: 1.0  
**Last Updated**: February 14, 2026  
**Status**: Active  
**Owner**: Samvad AI Engineering Team
