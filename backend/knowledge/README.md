# Jalan-Jalan AI Knowledge Base (RAG source documents)

Trusted travel documents used by the Travel Assistant (Session 9).

- **Local mode (default):** the backend reads these Markdown files directly when
  `KNOWLEDGE_BASE_ID` is empty — retrieve, then generate with Amazon Bedrock.
- **Amazon Bedrock Knowledge Base:** upload this folder to S3 and sync the KB:

```bash
aws s3 sync backend/knowledge/ s3://jalan-jalan-travel-docs/ --exclude "README.md"
aws bedrock-agent start-ingestion-job --knowledge-base-id <KB_ID> --data-source-id <DS_ID>
```

> These documents are learning material for the bootcamp. Visa and customs rules
> change — always verify with the official embassy/government source before travel.
> `jalan-jalan-travel-policy.md` describes a fictional company policy for demo purposes.
