import subprocess, sys, os, time, json

LOG = r"C:\Cursor_Codigo\Cockpit Monitoramento e Dados\Frontend\git-output.log"
DIR = r"C:\Cursor_Codigo\Cockpit Monitoramento e Dados\Frontend"
REMOTE = "https://github.com/SolutionCenter4Sys/Data_Cockpit_EBV.git"

def run(cmd, cwd=DIR, timeout=60):
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(f"\n>>> {cmd}\n")
    try:
        r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True,
                           timeout=timeout, shell=True)
        out = r.stdout + r.stderr
        with open(LOG, "a", encoding="utf-8") as f:
            f.write(out + f"\n[exit={r.returncode}]\n")
        return r.returncode, out
    except subprocess.TimeoutExpired as e:
        with open(LOG, "a", encoding="utf-8") as f:
            f.write(f"[TIMEOUT after {timeout}s]\n")
        return -1, "TIMEOUT"
    except Exception as e:
        with open(LOG, "a", encoding="utf-8") as f:
            f.write(f"[ERROR: {e}]\n")
        return -1, str(e)

# Limpar log
with open(LOG, "w", encoding="utf-8") as f:
    f.write(f"=== Cockpit EBV Git Push — {time.strftime('%Y-%m-%d %H:%M:%S')} ===\n")

print("Iniciando operações git...")

# 1. Init
code, out = run("git init -b main")
print(f"init: {code} — {out.strip()[:80]}")

# 2. Remote
run("git remote remove origin")
code, out = run(f"git remote add origin {REMOTE}")
print(f"remote add: {code}")

# 3. Fetch
code, out = run("git fetch origin main --depth=1", timeout=30)
print(f"fetch: {code} — {out.strip()[:80]}")

# 4. Reset para integrar histórico
code, out = run("git reset origin/main", timeout=10)
print(f"reset: {code} — {out.strip()[:80]}")

# 5. Stage all
code, out = run("git add -A")
print(f"add: {code}")

# 6. Status
code, out = run("git status --short")
print(f"status: {out.strip()[:200]}")

# 7. Commit
code, out = run('git commit -m "fix: corrige output_location=dist + Light Mode Equifax + theme toggle"')
print(f"commit: {code} — {out.strip()[:100]}")

# 8. Push
code, out = run("git push origin main --force-with-lease", timeout=60)
print(f"push: {code} — {out.strip()[:200]}")

with open(LOG, "a", encoding="utf-8") as f:
    f.write("\n=== DONE ===\n")

print("Concluido. Ver git-output.log para detalhes.")
