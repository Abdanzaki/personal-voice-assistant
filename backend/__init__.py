import os

def _sanitize_no_proxy():
    for var in ("NO_PROXY", "no_proxy"):
        val = os.environ.get(var)
        if val:
            cleaned = ",".join(
                item for item in val.split(",") if not (item.startswith("[") and item.endswith("]"))
            )
            os.environ[var] = cleaned

_sanitize_no_proxy()
