"""In-memory fake of the supabase client so service-layer tests run without
credentials (CI stays green). Patch points are the per-module `get_supabase`
bindings — each service module did `from app.database import get_supabase`."""
import uuid
from unittest.mock import patch

import pytest


class Result:
    def __init__(self, data):
        self.data = data


class FakeQuery:
    def __init__(self, db, table_name):
        self.db = db
        self.table_name = table_name
        self._rows = list(db.tables.get(table_name, []))
        self._mode = "select"
        self._insert_payload = None
        self._update_payload = None
        self._single = False
        self._limit = None
        self._order = None

    def select(self, *cols):
        self._mode = "select"
        return self

    def insert(self, payload):
        self._mode = "insert"
        self._insert_payload = payload
        return self

    def upsert(self, payload):
        self._mode = "upsert"
        self._insert_payload = payload
        return self

    def update(self, payload):
        self._mode = "update"
        self._update_payload = payload
        return self

    def delete(self):
        self._mode = "delete"
        return self

    def eq(self, col, val):
        self._rows = [r for r in self._rows if str(r.get(col)) == str(val)]
        return self

    def in_(self, col, vals):
        vals = {str(v) for v in vals}
        self._rows = [r for r in self._rows if str(r.get(col)) in vals]
        return self

    def single(self):
        self._single = True
        return self

    def limit(self, n):
        self._limit = n
        return self

    def order(self, col, desc=False):
        self._order = (col, desc)
        return self

    def execute(self):
        if self._mode in ("insert", "upsert"):
            # Handle bulk list inserts vs single item dict inserts
            raw_payloads = self._insert_payload if isinstance(self._insert_payload, list) else [self._insert_payload]
            inserted_rows = []
            
            rows = self.db.tables.setdefault(self.table_name, [])
            for raw in raw_payloads:
                payload = dict(raw)
                if "id" not in payload:
                    payload["id"] = str(uuid.uuid4())
                
                # Update existing row if matched by ID
                match = False
                for r in rows:
                    if str(r.get("id")) == str(payload["id"]):
                        r.update(payload)
                        inserted_rows.append(r)
                        match = True
                        break
                if not match:
                    rows.append(payload)
                    inserted_rows.append(payload)

            if self._single:
                return Result(inserted_rows[0] if inserted_rows else None)
            return Result(inserted_rows)

        if self._mode == "update":
            for r in self._rows:
                r.update(self._update_payload)
            if self._single:
                return Result(self._rows[0] if self._rows else None)
            return Result(self._rows)

        if self._mode == "delete":
            table_rows = self.db.tables.get(self.table_name, [])
            ids_to_remove = {str(r.get("id")) for r in self._rows if "id" in r}
            deleted_rows = [r for r in table_rows if str(r.get("id")) in ids_to_remove]
            self.db.tables[self.table_name] = [r for r in table_rows if str(r.get("id")) not in ids_to_remove]
            if self._single:
                return Result(deleted_rows[0] if deleted_rows else None)
            return Result(deleted_rows)

        rows = self._rows
        if self._order:
            col, desc = self._order
            rows = sorted(rows, key=lambda r: str(r.get(col, "")), reverse=desc)
        if self._limit:
            rows = rows[: self._limit]
            
        if self._single:
            return Result(rows[0] if rows else None)
        return Result(rows)

class FakeDB:
    """Tiny in-memory store. `prevent_booking_overlap` RPC defaults to
    no-conflict; override `overlap_rpc` to return False to simulate a clash."""

    def __init__(self):
        self.tables = {}
        self.overlap_rpc = True

    def table(self, name):
        return FakeQuery(self, name)

    def rpc(self, fn, args):
        # RPC returns a query-like; service calls .execute() → scalar boolean.
        value = self.overlap_rpc

        class _Rpc:
            def execute(self):
                return Result(value)

        return _Rpc()

    def auth(self):
        return None

    # Convenience seeding helpers.
    def seed(self, table, rows):
        self.tables.setdefault(table, []).extend(rows)
        return rows

    def row(self, table, **fields):
        rows = self.tables.setdefault(table, [])
        row = dict(fields)
        if "id" not in row:
            row["id"] = str(uuid.uuid4())
        if "created_at" not in row:
            row["created_at"] = "2026-08-08T00:00:00+00:00"
        rows.append(row)
        return row


_PATCHED_MODULES = [
    "app.services.audit_service.get_supabase",
    "app.services.booking_service.get_supabase",
    "app.services.work_order_service.get_supabase",
    "app.services.task_service.get_supabase",
    "app.services.additional_work_service.get_supabase",
    "app.services.availability_service.get_supabase",
    "app.services.plumber_matching_service.get_supabase",
    "app.services.assignment_service.get_supabase",
    "app.services.email_queue_service.get_supabase",
    "app.workers.email_worker.get_supabase",
]


@pytest.fixture
def fake_db():
    db = FakeDB()
    patchers = [patch(mod, return_value=db) for mod in _PATCHED_MODULES]
    for p in patchers:
        p.start()
    yield db
    for p in patchers:
        p.stop()
