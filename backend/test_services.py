import types

import pytest

from app.services.application_service import list_applications, create_application
from app.services.contact_service import create_contact, delete_contact


def _fake_conn_factory(app_rows=None, contact_rows=None, status_rows=None):
    """Build a fake connection/ cursor pair for service tests."""
    app_rows = app_rows or []
    contact_rows = contact_rows or []
    status_rows = status_rows or []

    class FakeCursor:
        def __init__(self):
            self.description = None
            self._rows = []

        def execute(self, query, params=None):
            # Very light routing based on query prefix
            q = " ".join(query.split()).lower()
            if "from applications" in q and "select" in q and "where status" not in q:
                self.description = [types.SimpleNamespace(name="id"), types.SimpleNamespace(name="company")]
                self._rows = app_rows
            elif "from applications" in q and "where status" in q:
                self.description = [types.SimpleNamespace(name="id"), types.SimpleNamespace(name="company")]
                self._rows = app_rows
            elif "into applications" in q:
                self.description = [types.SimpleNamespace(name="id"), types.SimpleNamespace(name="company")]
                self._rows = [(1, "ACME")]
            elif "into contacts" in q:
                self.description = [
                    types.SimpleNamespace(name="id"),
                    types.SimpleNamespace(name="application_id"),
                    types.SimpleNamespace(name="name"),
                    types.SimpleNamespace(name="role"),
                    types.SimpleNamespace(name="email"),
                    types.SimpleNamespace(name="linkedin"),
                ]
                self._rows = contact_rows or [(1, 1, "Jane Doe", "Recruiter", None, None)]
            elif "into status_history" in q:
                self.description = []
                self._rows = []
            elif "delete from contacts" in q:
                self.description = [types.SimpleNamespace(name="id")]
                self._rows = [(1,)]
            else:
                self.description = []
                self._rows = []

        def fetchall(self):
            return list(self._rows)

        def fetchone(self):
            return self._rows[0] if self._rows else None

        def close(self):
            pass

    class FakeConn:
        def cursor(self):
            return FakeCursor()

        def commit(self):
            pass

        def rollback(self):
            pass

        def close(self):
            pass

    return FakeConn()


@pytest.fixture(autouse=True)
def patch_get_db_connection(monkeypatch):
    """Patch get_db_connection used in services to avoid real DB calls."""
    from app import __init__ as app_init

    def _fake_get_db_connection():
        return _fake_conn_factory()

    monkeypatch.setattr(app_init, "get_db_connection", _fake_get_db_connection)
    yield


def test_list_applications_returns_dicts(monkeypatch):
    from app import __init__ as app_init

    # Patch connection with predictable rows
    fake_conn = _fake_conn_factory(app_rows=[(1, "ACME")])

    def _fake_get_db_connection():
        return fake_conn

    monkeypatch.setattr(app_init, "get_db_connection", _fake_get_db_connection)

    apps = list_applications(status_filter=None)
    assert isinstance(apps, list)
    assert apps[0]["id"] == 1
    assert apps[0]["company"] == "ACME"


def test_create_contact_returns_serialized_contact(monkeypatch):
    from app import __init__ as app_init
    from app.models import get_application_by_id

    # Ensure parent application lookup succeeds
    monkeypatch.setattr(
        "app.models.get_application_by_id",
        lambda app_id: {"id": app_id, "company": "ACME", "role": "Engineer"},
    )

    fake_conn = _fake_conn_factory()

    def _fake_get_db_connection():
        return fake_conn

    monkeypatch.setattr(app_init, "get_db_connection", _fake_get_db_connection)

    contact = create_contact(
        {
            "application_id": 1,
            "name": "Jane Doe",
            "role": "Recruiter",
            "email": None,
            "linkedin": None,
        }
    )
    assert contact["application_id"] == 1
    assert contact["name"] == "Jane Doe"

