# Samvad AI — System Design

## 1. Architecture Overview

Samvad AI is a cloud-native real-time accessibility platform that transforms live video streams into multi-modal accessible content with sub-2-second latency. The system ingests live streams, extracts audio, performs speech recognition, applies cultural transcreation, generates Indian Sign Language (ISL) avatars, synthesizes multi-language audio dubbing, and delivers synchronized adaptive bitrate streams via CDN.

The architecture follows a microservices pattern with event-driven communication, stateless compute, and horizontal scalability. All processing occurs in parallel pipelines to minimize end-to-end latency while maintaining synchronization across output modalities.

## 2. Processing Pipeline

```
Live Stream Input
    ↓
AWS MediaLive (Ingestion & Audio Extraction)
    ↓
Amazon Transcribe (Speech-to-Text Streaming)
    ↓
Amazon Bedrock (Cultural Transcreation)
    ↓
    ├─→ Custom NLP Pipeline (ISL Grammar) → Amazon Nova Reel (Avatar)
    │
    └─→ Amazon Polly (Neural Voice Dubbing)
    ↓
AWS Elemental MediaPackage (Stream Multiplexing)
    ↓
Amazon CloudFront (CDN Delivery)
    ↓
End Users (Web/Mobile)
```

**Pipeline Stages**:

1. **Media Ingestion** (50ms): MediaLive captures RTMP/WebRTC/HLS streams and extracts audio
2. **Speech Recognition** (400ms): Transcribe converts audio chunks to text with timestamps
3. **Cultural Transcreation** (250ms): Bedrock LLM adapts text with cultural context preservation
4. **Parallel Processing** (900ms max):
   - Path A: ISL grammar conversion (150ms) → Nova Reel avatar generation (750ms)
   - Path B: Polly neural voice synthesis (350ms)
5. **Multiplexing** (150ms): MediaPackage synchronizes avatar, audio, and subtitles into HLS/DASH
6. **Delivery** (100ms): CloudFront edge locations serve adaptive streams

**Total Latency**: ~1.85s (P95 < 2s target)

## 3. Core Components

### Ingestion Service

**AWS MediaLive** captures live streams and performs audio extraction.

- Accepts RTMP, WebRTC, HLS, DASH inputs
- Normalizes audio to 16kHz mono PCM
- Splits into 2-second chunks with 500ms overlap
- Publishes chunks to Amazon Kinesis Data Streams
- Handles stream reconnection and error recovery

### Speech Recognition

**Amazon Transcribe Streaming** converts audio to text in real-time.

- Supports 10+ Indian languages with accent adaptation
- Speaker diarization and automatic punctuation
- Custom vocabulary for domain-specific terms
- Confidence scores and timestamp alignment
- Outputs to Amazon EventBridge for downstream processing

### Cultural Transcreation Engine

**Amazon Bedrock** (Claude/Titan models) performs context-aware translation.

- Preserves idioms, metaphors, and cultural references
- Handles code-switching (English-Hindi mixing)
- Maintains context window across chunks using Amazon ElastiCache (Redis)
- Generates translations for 10+ target languages
- Caches common phrases to reduce latency

### ISL Grammar Converter

**Custom NLP Pipeline** transforms text to ISL grammatical structure.

- Deployed on AWS Lambda with container images
- Converts subject-verb-object to topic-comment structure
- Generates gloss notation for avatar rendering
- Adds non-manual markers (facial expressions, head movements)
- Rule-based engine with ML fallback for ambiguous cases

### Avatar Generation

**Amazon Nova Reel** synthesizes photorealistic 3D ISL avatars.

- Renders at 60 FPS with smooth sign transitions
- Facial animation synchronized with sign meaning
- Customizable appearance (skin tone, clothing, background)
- Pre-rendered sign library (5000+ signs) for common vocabulary
- GPU-accelerated rendering on EC2 G5 instances

### Audio Dubbing

**Amazon Polly Neural TTS** generates multi-language voice synthesis.

- Neural voices for 10+ Indian languages
- Tone and emotion matching with original speaker
- SSML markup for prosody control
- Streaming output for low latency
- Voice cloning via custom lexicons

### Multiplexing Layer

**AWS Elemental MediaPackage** synchronizes and packages streams.

- Combines avatar video, dubbed audio, and subtitles
- Generates HLS/DASH adaptive bitrate manifests
- Maintains <100ms sync accuracy across tracks
- Creates multiple quality levels (240p-1080p)
- Just-in-time packaging for live content

### Delivery Layer

**Amazon CloudFront** distributes streams globally.

- Edge locations across India (Mumbai, Delhi, Bangalore, Hyderabad)
- HTTP/3 and Brotli compression support
- 2-second TTL for live segment caching
- Origin shield for origin protection
- Real-time logs to Amazon Kinesis for monitoring

## 4. Orchestration

**AWS Step Functions** coordinates the end-to-end workflow.

- Express Workflows for high-throughput, short-duration processing
- Parallel state execution for ISL and dubbing paths
- Error handling with exponential backoff retry (max 3 attempts)
- Dead letter queue (Amazon SQS) for failed chunks
- CloudWatch integration for workflow monitoring

**Event-Driven Architecture**:

- Amazon EventBridge routes events between services
- Amazon Kinesis Data Streams for high-throughput chunk processing
- Amazon SQS for asynchronous task queuing
- AWS Lambda for serverless compute orchestration

## 5. Latency Optimization

**Parallel Processing**:

- ISL and dubbing pipelines execute concurrently
- Step Functions parallel state reduces critical path
- GPU batching processes 4-16 streams per instance
- Async I/O prevents blocking operations

**Chunked Streaming**:

- 2-second audio chunks balance latency and context
- 500ms overlap prevents word cutoff
- Streaming APIs (Transcribe, Polly) reduce buffering
- Progressive rendering starts before chunk completion

**Pre-Warmed Compute**:

- Lambda provisioned concurrency (2+ instances per function)
- EC2 warm pools for GPU instances
- Models pre-loaded in memory (EFS shared storage)
- Predictive scaling before traffic spikes

**Edge Caching**:

- CloudFront edge locations reduce RTT
- MediaPackage origin caching (5-second window)
- ElastiCache for transcreation results (1-hour TTL)
- Pre-rendered avatar segments for common signs

## 6. Scalability Model

**Auto-Scaling Infrastructure**:

- EC2 Auto Scaling Groups for GPU instances (target: 70% utilization)
- Lambda concurrency scaling (up to 1000 concurrent executions)
- Kinesis shard auto-scaling based on throughput
- MediaLive channel scaling for concurrent streams

**Serverless Architecture**:

- Lambda for stateless processing (grammar conversion, orchestration)
- Fargate for containerized services (transcreation engine)
- API Gateway for REST/WebSocket endpoints
- DynamoDB for session state and metadata

**Model Tiering**:

- Tier 1 (High Priority): Full 60 FPS avatar, neural voices
- Tier 2 (Standard): 30 FPS avatar, standard voices
- Tier 3 (Fallback): Text-only subtitles, no avatar
- Dynamic tier assignment based on load and user preferences

## 7. Reliability & Failover

**Monitoring**:

- CloudWatch metrics for latency, error rates, GPU utilization
- X-Ray distributed tracing for end-to-end request tracking
- CloudWatch Logs Insights for log analysis
- SNS alerts for threshold breaches (latency > 2s, error rate > 1%)

**Error Handling**:

- Exponential backoff retry (max 3 attempts, 100ms-1s delays)
- Circuit breaker pattern for failing dependencies
- Dead letter queues for unprocessable chunks
- Graceful degradation to lower quality tiers

**Graceful Degradation**:

- Skip failed chunks after retries, continue stream
- Fall back to text-only if avatar rendering fails
- Use cached translations if Bedrock unavailable
- Display "Processing..." indicator during temporary delays

**Multi-Region Failover**:

- Primary: ap-south-1 (Mumbai)
- Secondary: ap-south-2 (Hyderabad)
- Route 53 health checks with automatic DNS failover
- Cross-region replication for S3 and DynamoDB
- RTO: 15 minutes, RPO: 5 minutes

## 8. Security & Compliance

**Encryption**:

- TLS 1.3 for all API traffic (API Gateway, CloudFront)
- AES-256 encryption at rest (S3, EBS, DynamoDB)
- AWS KMS for key management with automatic rotation
- DTLS-SRTP for WebRTC media streams

**Access Control**:

- IAM roles with least privilege principle
- VPC isolation for compute resources
- Security groups whitelist required ports only
- AWS WAF for API protection (rate limiting, SQL injection)

**Accessibility Standards**:

- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatible (ARIA labels)
- High contrast UI themes

**Compliance**:

- GDPR and Indian data protection laws
- No audio/video storage beyond processing (7-day retention)
- Anonymized analytics data
- User data deletion within 30 days on request

## 9. Technology Stack Summary

**AWS Media Services**:
- AWS Elemental MediaLive (stream ingestion)
- AWS Elemental MediaPackage (adaptive bitrate packaging)
- Amazon CloudFront (CDN delivery)

**AWS AI/ML Services**:
- Amazon Transcribe (speech-to-text streaming)
- Amazon Bedrock (cultural transcreation LLM)
- Amazon Nova Reel (avatar generation)
- Amazon Polly (neural voice synthesis)

**AWS Compute**:
- AWS Lambda (serverless functions)
- Amazon EC2 G5 instances (GPU workloads)
- AWS Fargate (containerized services)

**AWS Storage & Databases**:
- Amazon S3 (HLS segments, transcripts)
- Amazon ElastiCache (Redis for caching)
- Amazon DynamoDB (session state, metadata)
- Amazon EFS (shared model storage)

**AWS Messaging & Orchestration**:
- AWS Step Functions (workflow coordination)
- Amazon EventBridge (event routing)
- Amazon Kinesis Data Streams (chunk processing)
- Amazon SQS (task queuing, DLQ)

**AWS Networking & Security**:
- Amazon VPC (network isolation)
- AWS WAF (web application firewall)
- AWS KMS (key management)
- Amazon Route 53 (DNS and failover)

**AWS Monitoring & Operations**:
- Amazon CloudWatch (metrics, logs, alarms)
- AWS X-Ray (distributed tracing)
- Amazon SNS (alerting)

**Custom Components**:
- ISL Grammar Converter (Python/Lambda)
- Web Player (React/WebRTC)
- Mobile SDK (iOS/Android native)

---

**Version**: 1.0  
**Last Updated**: February 14, 2026  
**Status**: Active
