from pathlib import Path
import sys

import pytest
from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from main import app
from state import reset_scan_state


@pytest.fixture(autouse=True)
def clean_scan_state():
    reset_scan_state()
    yield
    reset_scan_state()


@pytest.fixture
def client():
    return TestClient(app)
