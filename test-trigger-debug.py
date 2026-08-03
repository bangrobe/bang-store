"""Debug: test trigger functions step by step"""
import os, uuid
from supabase import create_client

def load_env(path):
    if not os.path.exists(path):
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ[k.strip()] = v.strip()

load_env("/home/bangdigi/projects/supabase/personal-finance/.env")
load_env("/home/bangdigi/workspace/projects/bang-store/.env.local")

FIN_URL = os.environ.get("SUPABASE_URL")
FIN_SERVICE = os.environ.get("SUPABASE_SECRET_KEY")
EMAIL = os.environ.get("AUTH_EMAIL")
PASSWORD = os.environ.get("AUTH_PASSWORD_TEST")

fin_admin = create_client(FIN_URL, FIN_SERVICE)
auth = fin_admin.auth.sign_in_with_password({"email": EMAIL, "password": PASSWORD})
user_id = auth.user.id
print(f"User ID (text): {user_id}")

# Get scope
scope_resp = fin_admin.from_("financial_scopes").select("id,code").eq("user_id", user_id).eq("code", "business").execute()
scope = scope_resp.data[0]
scope_id = scope["id"]
print(f"Scope ID (uuid): {scope_id}")

# Test 1: resolve_bss_scope
print("\n=== Test resolve_bss_scope ===")
try:
    r = fin_admin.rpc("resolve_bss_scope", {"p_user_id": user_id}).execute()
    print(f"Result: {r.data}")
except Exception as e:
    print(f"Error: {e}")

# Test 2: resolve_bss_account (transfer → BIDV HKD)
print("\n=== Test resolve_bss_account (BIDV HKD) ===")
try:
    r = fin_admin.rpc("resolve_bss_account", {"p_scope_id": scope_id, "p_user_id": user_id, "p_account_name": "BIDV HKD"}).execute()
    print(f"Result: {r.data}")
except Exception as e:
    print(f"Error: {e}")

# Test 3: resolve_bss_category
print("\n=== Test resolve_bss_category ===")
try:
    r = fin_admin.rpc("resolve_bss_category", {"p_scope_id": scope_id, "p_user_id": user_id, "p_category_name": "Bán hàng"}).execute()
    print(f"Result: {r.data}")
except Exception as e:
    print(f"Error: {e}")

# Test 4: Check accounts table structure
print("\n=== Check accounts columns ===")
r = fin_admin.from_("accounts").select("*").eq("user_id", user_id).limit(1).execute()
if r.data:
    print(f"Account columns: {list(r.data[0].keys())}")
