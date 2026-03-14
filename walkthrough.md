# End-to-End DevOps Pipeline: Tender Management System

This guide outlines the complete DevOps project we built for the Tender Management System. It breaks down every tool used, why we chose it, and exactly how the pipeline flows from a developer's laptop to a live AWS server.

---

## 🏗️ 1. Containerization (Docker)

**What it is:** Docker packages an application and all its dependencies into a single, standardized unit called a "container" so it runs exactly the same way on any computer.
**Why we used it:** To guarantee that the React frontend, Node.js backend, and MongoDB database work perfectly in the cloud without having to manually install Node or Mongo on the AWS server.

**How we implemented it:**
- **`Dockerfile`s:** We wrote one for the client and one for the server. These are instructions telling Docker how to build the application environments.
- **[docker-compose.yml](file:///k:/github%20projects/tender_management_system/docker-compose.yml):** We used docker-compose to orchestrate running the frontend, backend, and database simultaneously on your local machine for testing before pushing to the cloud.

---

## ☁️ 2. Infrastructure as Code (Terraform)

**What it is:** Terraform allows you to write actual code to provision and manage cloud infrastructure, rather than clicking through the AWS website manually.
**Why we used it:** It makes infrastructure reproducible, version-controlled, and easily destroyable (to save costs!).

**How we implemented it (`terraform/` folder):**
- **`main.tf`:** We wrote code to ask AWS for a Virtual Private Cloud (VPC), a Security Group (firewall opening ports 80, 443, 22, 6443), and a Free-Tier `t2.micro` EC2 instance in the `ap-south-1` region.
- **Startup Script:** Inside `main.tf`, we passed a `user_data` bash script that automatically installed the **K3s** Kubernetes engine the moment the EC2 server finished booting up.

---

## ☸️ 3. Container Orchestration (Kubernetes)

**What it is:** Kubernetes (K8s) is an orchestration tool that automatically manages, scales, and heals Docker containers across a cluster of servers. We used **K3s**, a lightweight version perfectly designed for single-node Free-Tier servers.
**Why we used it:** If the Node.js backend crashes, Kubernetes automatically restarts it. If traffic spikes, Kubernetes scales it.

**How we implemented it (`k8s/` folder):**
We wrote YAML "manifests" to tell the K3s engine exactly what state we want the applications to be in:
- **[server.yaml](file:///k:/github%20projects/tender_management_system/k8s/server.yaml) & [client.yaml](file:///k:/github%20projects/tender_management_system/k8s/client.yaml):** We defined `Deployments` to run exactly 1 replica of the frontend and backend to save memory. We also defined `Services` to expose them so they can talk to each other.
- **[db.yaml](file:///k:/github%20projects/tender_management_system/k8s/db.yaml):** We defined a `StatefulSet` for MongoDB (because databases need persistent storage) and strictly limited its RAM to 384MB so it wouldn't crash the tiny 1GB AWS server.
- **`hpa.yaml`:** We prepared Horizontal Pod Autoscalers (HPA) to automatically spin up more replicas if CPU usage crosses 80%.

---

## 🚀 4. CI/CD Pipeline (GitHub Actions)

**What it is:** Continuous Integration / Continuous Deployment (CI/CD) automates the entire process of testing, building, and deploying code the moment a developer pushes to GitHub.
**Why we used it:** It eliminates human error in deployments and speeds up the release cycle. 

**How we implemented it ([.github/workflows/deploy.yml](file:///k:/github%20projects/tender_management_system/.github/workflows/deploy.yml)):**
We created a workflow that automatically triggers on every `git push` to the `main` branch. 

**The Pipeline Flow:**
1. **Checkout:** GitHub downloads your latest code.
2. **Docker Login:** GitHub securely logs into your Docker Hub account using repository `Secrets`.
3. **Build:** GitHub reads your `Dockerfile`s to build fresh images of the frontend and backend.
4. **Security Scan:** Before going live, we integrated **Trivy**, an industry-standard security tool, to scan the new Docker images for Critical/High vulnerabilities.
5. **Push:** GitHub pushes the newly built images up to your public Docker Hub repository.
6. **Deploy to AWS:** GitHub uses the `kubeconfig` secret we extracted from the EC2 instance to remotely authenticate with your AWS server's Kubernetes API. It runs `kubectl apply` to pull the new images from Docker Hub and restart the live server without downtime!

---

## 🎯 The Final Result

Whenever you type `git push origin main` on your laptop, this entire complex chain of events happens automatically in the background within 4 minutes, culminating in a live, updated application on AWS!

---

## 🎤 How to Demo This in an Interview

When asked to demonstrate your project, follow this step-by-step flow to impress your interviewers:

**1. Show the Architecture (The "Code")**
- Open VS Code. Show them the `tender_management_system` folder.
- Briefly click through the `Dockerfile`s to show you containerized the apps.
- Open the [terraform/main.tf](file:///k:/github%20projects/tender_management_system/terraform/main.tf) file. Explain: *"I used Terraform to automatically provision an AWS EC2 instance and run a startup script that installed K3s Kubernetes."*
- Open the `k8s/` folder. Explain: *"Here are my Kubernetes manifests. Notice I used a StatefulSet for MongoDB, and strict resource limits to prevent my Free-Tier server from crashing."*

**2. Explain the Automation (The "Brain")**
- Open [.github/workflows/deploy.yml](file:///k:/github%20projects/tender_management_system/.github/workflows/deploy.yml). 
- Walk them through the steps: *"This pipeline triggers on a git push. It builds the Docker images, scans them for security vulnerabilities using Trivy, pushes them to Docker Hub, and remotely runs `kubectl apply` on my AWS cluster."*

**3. The Live Demonstration (The "Wow" Factor)**
- Tell them: *"Let me show you a live deployment."*
- Open your Frontend code (e.g., `App.jsx` or a title in `index.html`) and make a very small, visible text change (like changing "Tender Management" to "Tender Management System V2").
- Go to your terminal and run:
  ```bash
  git add .
  git commit -m "Interview Demo Change"
  git push origin main
  ```
- Immediately jump to your browser and open the **GitHub Actions** tab for your repository. Let them watch in real-time as the automated pipeline spins up and deploys the change without you doing any manual work!

**4. The Proof (The "Live Server")**
- Open your terminal and SSH into your AWS server: `ssh -i "pipeline-keypairs.pem" ubuntu@<YOUR_AWS_IP>`
- Run `sudo kubectl get all` to prove that the pods are actively running the code you just deployed.
