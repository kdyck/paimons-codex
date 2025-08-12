# Third-Party Licenses

This project is designed for **local development and experimentation**. It uses several third-party services and libraries, each with their own licensing terms:

> **Production Note**: For production deployment, we recommend using managed cloud services (OCI Object Storage, Oracle Autonomous Database, etc.) to simplify licensing and improve security/scalability.

## Container Services

### MinIO
- **License**: GNU Affero General Public License v3.0 (AGPL-3.0)
- **Usage**: S3-compatible object storage service
- **Source**: https://github.com/minio/minio
- **License URL**: https://github.com/minio/minio/blob/master/LICENSE

### Oracle Database 23ai Free
- **License**: Oracle Free Use Terms and Conditions
- **Usage**: Database with vector search capabilities
- **Source**: Oracle Container Registry
- **License URL**: https://www.oracle.com/downloads/licenses/oracle-free-license.html

### Ollama
- **License**: MIT License
- **Usage**: Large Language Model serving
- **Source**: https://github.com/ollama/ollama
- **License URL**: https://github.com/ollama/ollama/blob/main/LICENSE

### Caddy
- **License**: Apache License 2.0
- **Usage**: Reverse proxy and web server
- **Source**: https://github.com/caddyserver/caddy
- **License URL**: https://github.com/caddyserver/caddy/blob/master/LICENSE

## AI Models

### Stable Diffusion Models
- **License**: Various (depends on specific model)
- **Common Licenses**: CreativeML OpenRAIL-M License, Apache 2.0
- **Usage**: AI image generation
- **Note**: Check specific model cards on Hugging Face for exact licensing terms

### Llama Models
- **License**: Meta Llama 3.2 Community License Agreement
- **Usage**: Text generation and chat
- **Source**: Meta AI
- **License URL**: https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/LICENSE

## Python Dependencies

Major Python packages used in the API:
- **FastAPI**: MIT License
- **SQLAlchemy**: MIT License
- **Pydantic**: MIT License
- **httpx**: BSD 3-Clause License
- **Pillow**: HPND License
- **APScheduler**: MIT License

## JavaScript Dependencies

Major JavaScript packages used in the UI:
- **React**: MIT License
- **TypeScript**: Apache License 2.0
- **styled-components**: MIT License
- **React Router**: MIT License

## License Compatibility

**Our MIT License** is compatible with most of the above licenses for our use case:

✅ **Compatible for Usage**:
- MIT (Ollama, FastAPI, React, etc.)
- Apache 2.0 (Caddy, TypeScript)
- BSD licenses
- Oracle Free Use Terms (for development/non-commercial use)

⚠️ **Special Considerations**:
- **MinIO (AGPL-3.0)**: Used as a service, not linked/distributed with our code
- **AI Models**: Each model has specific licensing terms - check before commercial use
- **Oracle Database**: Free for development, check licensing for production use

## Production Deployment Recommendations

**For Production Use**, we recommend replacing containerized services with managed alternatives:

### Recommended Production Stack:
1. **Object Storage**: 
   - Replace MinIO → **OCI Object Storage** (no licensing concerns)
   - Alternative: AWS S3, Azure Blob Storage
2. **Database**: 
   - Replace Oracle container → **Oracle Autonomous Database** (managed service)
   - Alternative: Oracle Cloud Database Service
3. **Container Platform**: 
   - Deploy to **OCI Container Instances** or **Oracle Kubernetes Engine**
4. **AI Services**: 
   - Use **OCI AI Services** or keep containerized AI services
   - Verify AI model licenses for commercial use

### Benefits of Managed Services:
- ✅ **Simple Licensing**: No AGPL-3.0 concerns
- ✅ **Enterprise Security**: Built-in security and compliance
- ✅ **High Availability**: Automatic scaling and backups
- ✅ **Professional Support**: Oracle support included

## Compliance Recommendations

1. **Development/Personal Use**: All licenses permit this usage
2. **Open Source Distribution**: Ensure all license requirements are met
3. **Commercial Deployment**: 
   - Review MinIO AGPL-3.0 requirements
   - Consider Oracle commercial licensing
   - Verify AI model licenses permit commercial use
   - Consider managed services (OCI Object Storage, OCI ATP, AWS RDS, S3) for simpler licensing

## Updates

This license information is current as of January 2025. License terms may change, so always check the latest licensing information from the respective projects before deployment.