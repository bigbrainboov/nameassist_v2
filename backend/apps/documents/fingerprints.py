"""Content identity for grouping a customer's repeated uploads."""
import hashlib


def fingerprint_file(file):
    digest = hashlib.sha256()
    file.seek(0)
    try:
        for chunk in file.chunks():
            digest.update(chunk)
    finally:
        file.seek(0)
    return digest.hexdigest()
# SIRI.DEV
