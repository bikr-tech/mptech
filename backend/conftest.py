from unittest.mock import MagicMock, patch
import pytest

class AwaitableMock(MagicMock):
    async def __await__(self):
        return self.mock_return_value


@pytest.fixture(autouse=True)
def mock_asyncio_create_task():
    with patch("app.services.assignment_service.asyncio") as mock_asyncio:
        mock_asyncio.create_task.return_value = AwaitableMock()
        yield
