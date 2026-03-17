# 🏗️ Tender Management System — DevOps Pipeline

A full-stack Tender Management System deployed with a complete end-to-end DevOps pipeline on AWS using Docker, Kubernetes, Terraform, and GitHub Actions.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js (served via Nginx) |
| **Backend** | Node.js / Express |
| **Database** | MongoDB (StatefulSet) |
| **Containerization** | Docker + Docker Compose |
| **Orchestration** | Kubernetes (K3s) |
| **Infrastructure** | Terraform (AWS EC2, Security Groups, Elastic IP) |
| **CI/CD** | GitHub Actions |
| **Security Scanning** | Trivy (CVE scanning on Docker images) |

---

## 🔄 CI/CD Pipeline

Every push to `main` triggers the following automated pipeline:

```
Code Push → Build Docker Images → Trivy Security Scan → Push to Docker Hub → Deploy to K3s
```

1. **Build** — Docker images for client and server are built
2. **Scan** — Trivy scans for CRITICAL/HIGH CVEs
3. **Push** — Images tagged with commit SHA are pushed to Docker Hub
4. **Deploy** — `kubectl apply` deploys to the K3s cluster on AWS

---

## 📁 Project Structure

```
├── .github/workflows/       # GitHub Actions CI/CD pipeline
├── k8s/                     # Kubernetes manifests
│   ├── client.yaml          # Frontend deployment + NodePort service
│   ├── server.yaml          # Backend deployment + ClusterIP service
│   ├── db.yaml              # MongoDB StatefulSet
│   └── hpa.yaml             # Horizontal Pod Autoscaler
├── terraform/               # Infrastructure as Code (AWS)
│   ├── main.tf              # EC2, Security Group, Elastic IP
│   └── variables.tf         # Input variables
├── tender_management_System_client/   # React frontend
└── tender_management_System_server/   # Node.js backend
```

---

## ☁️ Infrastructure (Terraform)

- **AWS EC2** instance provisioned automatically via Terraform
- **Elastic IP** attached for a stable, non-changing public endpoint
- **Security Group** with only required ports open (22, 80, 443, 30000-32767)
- **K3s** installed automatically via EC2 `user_data` script
- **2GB Swap file** configured to prevent OOM crashes on constrained instances

---

## 🚀 How to Deploy

### Prerequisites
- AWS account with access keys
- Docker Hub account
- SSH key pair created in AWS

### 1. Provision Infrastructure
```bash
cd terraform
terraform init
terraform apply -auto-approve
```

### 2. Configure GitHub Secrets
| Secret | Value |
|---|---|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Your Docker Hub password |
| `KUBECONFIG_DATA` | Base64-encoded K3s kubeconfig |

### 3. Trigger Pipeline
```bash
git push origin main
```

---

## 🔒 Security Features

- **Trivy CVE scanning** on every Docker image before deployment
- **Image tagging with commit SHA** for full deployment traceability
- **Kubernetes Secrets** for sensitive data (JWT keys)
- **ClusterIP** for backend — not exposed directly to internet
- **Docker Hub push restricted** to `main` branch only

---

## 📊 Kubernetes Resources

| Resource | Type | Purpose |
|---|---|---|
| `tender-client` | Deployment + NodePort | Serves React frontend on port 30080 |
| `tender-server` | Deployment + ClusterIP | Node.js API (internal only) |
| `mongo` | StatefulSet | Persistent MongoDB database |
| HPA | HorizontalPodAutoscaler | Auto-scales server pods on CPU load |
