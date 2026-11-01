import pytest
from botocore.exceptions import ClientError

from services import bedrock_service
from services.bedrock_service import AIServiceError, inference_profile_id


def test_inference_profile_id():
    assert inference_profile_id("amazon.nova-lite-v1:0", "ap-southeast-2") == "apac.amazon.nova-lite-v1:0"
    assert inference_profile_id("amazon.nova-lite-v1:0", "us-east-1") == "us.amazon.nova-lite-v1:0"
    assert inference_profile_id("apac.amazon.nova-lite-v1:0", "ap-southeast-2") is None


class FakeClient:
    def __init__(self, fail_message):
        self.fail_message, self.calls = fail_message, []

    def converse(self, modelId, **_):
        self.calls.append(modelId)
        if len(self.calls) == 1:
            raise ClientError({"Error": {"Code": "ValidationException", "Message": self.fail_message}}, "Converse")
        return {"output": {"message": {"content": [{"text": "hello"}]}}}


def test_retries_with_inference_profile(monkeypatch):
    client = FakeClient("on-demand throughput isn't supported. Retry with an inference profile.")
    monkeypatch.setattr(bedrock_service, "get_client", lambda: client)
    monkeypatch.setattr(bedrock_service.config, "MODEL_ID", "amazon.nova-lite-v1:0")
    monkeypatch.setattr(bedrock_service.config, "AWS_REGION", "ap-southeast-2")
    assert bedrock_service.converse([{"role": "user", "content": "hi"}]) == "hello"
    assert client.calls == ["amazon.nova-lite-v1:0", "apac.amazon.nova-lite-v1:0"]


def test_other_errors_are_reported(monkeypatch):
    client = FakeClient("Something else is wrong")
    monkeypatch.setattr(bedrock_service, "get_client", lambda: client)
    with pytest.raises(AIServiceError, match="ValidationException"):
        bedrock_service.converse([{"role": "user", "content": "hi"}])
    assert len(client.calls) == 1
