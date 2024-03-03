#! /usr/bin/env python

import click
import os
import json
import time
import re
import requests
from io import StringIO
import pandas as pd


@click.command()
@click.argument(
    "i18n_dir",
    type=click.Path(exists=True, dir_okay=True, file_okay=False),
)
@click.argument("csv_path", type=click.Path())
@click.option(
    "-e",
    "--extract",
    default=False,
    is_flag=True,
    help="extract csv from i18n directory",
)
@click.option("-n", "--msg-name", default="", help="i18n message filename")
@click.option(
    "-p",
    "--prioritize",
    default=["en"],
    multiple=True,
    help="Languages to prioritize at the beginning of CSV columns, e.g., 'en,zh'.",
)
@click.option(
    "-o",
    "--overwrite",
    default=False,
    is_flag=True,
    help="overwrites existing i18n messages, default is False",
)
@click.option(
    "-w",
    "--watch",
    default=0.0,
    is_flag=False,
    flag_value=1,
    help="Enable watch mode to automatically update i18n when the CSV file changes.",
)
@click.option("--sheet-name", default=None, help="The name of the sheet")
@click.option(
    "--range", default=None, help="Any valid range specifier, e.g. A1:C99 or B2:F"
)
def cli(
    i18n_dir: str,
    csv_path: str,
    extract=False,
    msg_name="",
    prioritize="",
    overwrite=False,
    watch=0,
    sheet_name=None,
    range=None,
):
    locales_data = parse_locales(i18n_dir, msg_name)
    if extract:
        return extract_csv(
            locales_data["locales"],
            csv_path,
            prioritize,
        )

    count = 0
    translated = csv_path
    last_hash = 0

    while True:
        if watch < 0.1:
            if count >= 1:
                break
        elif count > 0:
            time.sleep(watch)

        count += 1
        data, current_hash = parse_translated(
            translated, sheet_name=sheet_name, range=range
        )

        if current_hash == last_hash:
            continue

        last_hash = current_hash
        for code in data:
            filename = locales_data["msg_name"].replace("<code>", code)
            msg_path = os.path.join(i18n_dir, filename)
            update_msg(msg_path, data[code], overwrite=overwrite)

        print(f'{time.strftime("%H:%M:%S")} UPDATED hash={current_hash}')


def parse_locales(i18n_dir: str, msg_name: str):
    dir_items = os.listdir(i18n_dir)
    codes = [os.path.splitext(i)[0] for i in dir_items]

    if len(dir_items) > 1 and not msg_name:
        if os.path.isfile(os.path.join(i18n_dir, dir_items[0])):
            msg_name = "<code>" + os.path.splitext(dir_items[0])[1]

        code_dir = os.path.join(i18n_dir, codes[0])
        if (not msg_name) and os.path.isdir(code_dir):
            items = os.listdir(code_dir)
            if len(items) == 1 and not os.path.isdir(items[0]):
                msg_name = f"<code>/{items[0]}"

    if not msg_name:
        msg_name = "<code>.json"

    locales = {c: os.path.join(i18n_dir, msg_name.replace("<code>", c)) for c in codes}

    return {
        "locales": locales,
        "msg_name": msg_name,
    }


def get_path(i18n_dir: str, item: str, filename: str):
    """parse path from listdir() or code and filename"""
    msg_path = os.path.join(i18n_dir, item)
    return os.path.join(msg_path, filename) if os.path.isdir(msg_path) else msg_path


def extract_csv(locales: dict, output: str, prioritize: list[str]):
    data = {}
    for code in list(dict.fromkeys([*prioritize, *locales.keys()])):
        with open(locales[code], "r", encoding="utf8") as f:
            data[code] = pd.json_normalize(json.load(f)).transpose()[0]
    df = pd.DataFrame(data)

    if output == "-":
        print(df.to_csv())
    else:
        df.to_csv(output)


def merge(base: dict, additional: dict):
    new = {**base, **additional}
    for k, v in additional.items():
        if isinstance(v, dict) and isinstance(new[k], dict):
            new[k] = merge(new[k], v)
    return new


def denormalize(value: dict):
    data = {}
    for code, d in value.items():
        data[code] = {}
        for k, v in d.items():
            keys = k.split(".")
            current = data[code]
            for i, key in enumerate(keys):
                if i == len(keys) - 1:
                    current[key] = v
                    pass
                else:
                    current[key] = current[key] if key in current else {}
                    current = current[key]
    return data


def update_msg(msg_path: str, content: dict, overwrite=False):
    try:
        dir_path = os.path.dirname(msg_path)
        os.makedirs(dir_path, exist_ok=True)
        open_mode = "r+" if os.path.exists(msg_path) else "w+"
        with open(msg_path, open_mode, encoding="utf8") as f:
            msg = json.loads(f.read() or "{}")
            data = merge(msg, content) if not overwrite else content
            f.seek(0)
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.truncate()
    except Exception as e:
        print("Error: ", msg_path)
        raise e


def parse_translated(translated: str, sheet_name="", range="", index_col=0):
    data = {}

    sheets_match = re.match(
        r"https?://docs.google.com/spreadsheets/d/(.+)/", translated
    )
    if sheets_match:
        sheets_id = sheets_match[1]
        qs = ["tqx=out:csv"]
        if sheet_name:
            qs.append(f"sheet={sheet_name}")
        if range:
            qs.append(f"range={range}")
        res = requests.get(
            f'https://docs.google.com/spreadsheets/d/{sheets_id}/gviz/tq?{"&".join(qs)}'
        )

        df = pd.read_csv(StringIO(res.text), index_col=index_col).fillna("")
        return denormalize(df.to_dict(orient="dict")), hash(res.text)

    csv_url_match = re.match(r"https?://.+\.csv(?![^?#])", translated)

    if csv_url_match:
        res = requests.get(translated)
        df = pd.read_csv(StringIO(res.text), index_col=index_col).fillna("")
        return denormalize(df.to_dict(orient="dict")), hash(res.text)

    mtime = os.stat(translated).st_mtime
    if translated.endswith(".csv"):
        df = pd.read_csv(translated, index_col=index_col).fillna("")
        return denormalize(df.to_dict(orient="dict")), mtime

    if translated.endswith(".json"):
        with open(translated, "r", encoding="utf8") as f:
            data = json.load(f)
            return data, mtime

    if translated.endswith(".jl"):
        with open(translated, "r", encoding="utf8") as f:
            for line in f:
                data = {**data, **json.load(line)}
        return data, mtime


if __name__ == "__main__":
    cli()