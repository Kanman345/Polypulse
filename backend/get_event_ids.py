"""
Fetch Polymarket event IDs from the Gamma API.

Usage:
    python get_event_ids.py --search "fed decision"
    python get_event_ids.py --active --limit 50
    python get_event_ids.py --slug some-event-slug
    python get_event_ids.py --tag fed --closed false --limit 100 --json
"""

import argparse
import json

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

GAMMA_BASE = "https://gamma-api.polymarket.com"


def make_session():
    session = requests.Session()
    retries = Retry(
        total=5,
        backoff_factor=1.5,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
    )
    adapter = HTTPAdapter(max_retries=retries)
    session.mount("https://", adapter)
    return session


SESSION = make_session()


def list_events(limit=50, offset=0, active=None, closed=None, archived=None,
                 tag=None, slug=None, order="id", ascending=False):
    """List events via GET /events with optional filters."""
    params = {
        "limit": limit,
        "offset": offset,
        "order": order,
        "ascending": str(ascending).lower(),
    }
    if active is not None:
        params["active"] = str(active).lower()
    if closed is not None:
        params["closed"] = str(closed).lower()
    if archived is not None:
        params["archived"] = str(archived).lower()
    if tag:
        params["tag"] = tag
    if slug:
        params["slug"] = slug

    resp = SESSION.get(f"{GAMMA_BASE}/events", params=params, timeout=15)
    resp.raise_for_status()
    return resp.json()


def search_events(query, events_status="active", limit=20):
    """Search events by keyword via GET /public-search."""
    params = {
        "q": query,
        "events_status": events_status,
        "limit_per_type": limit,
    }
    resp = SESSION.get(f"{GAMMA_BASE}/public-search", params=params, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    return data.get("events", [])


def main():
    parser = argparse.ArgumentParser(description="Fetch Polymarket event IDs")
    parser.add_argument("--search", help="Keyword search for event title")
    parser.add_argument("--slug", help="Exact event slug to look up")
    parser.add_argument("--tag", help="Filter by tag/category slug")
    parser.add_argument("--active", choices=["true", "false"], default=None)
    parser.add_argument("--closed", choices=["true", "false"], default=None)
    parser.add_argument("--archived", choices=["true", "false"], default=None)
    parser.add_argument("--limit", type=int, default=50)
    parser.add_argument("--offset", type=int, default=0)
    parser.add_argument("--json", action="store_true", help="Print raw JSON instead of a table")
    args = parser.parse_args()

    if args.search:
        events = search_events(args.search, limit=args.limit)
    else:
        active = None if args.active is None else args.active == "true"
        closed = None if args.closed is None else args.closed == "true"
        archived = None if args.archived is None else args.archived == "true"
        events = list_events(
            limit=args.limit,
            offset=args.offset,
            active=active,
            closed=closed,
            archived=archived,
            tag=args.tag,
            slug=args.slug,
        )

    if args.json:
        print(json.dumps(events, indent=2))
        return

    if not events:
        print("No events found.")
        return

    print(f"{'ID':<10} {'SLUG':<50} TITLE")
    print("-" * 100)
    for e in events:
        print(f"{e.get('id', ''):<10} {e.get('slug', '')[:48]:<50} {e.get('title', '')}")

    print(f"\n{len(events)} event(s) returned.")


if __name__ == "__main__":
    main()
