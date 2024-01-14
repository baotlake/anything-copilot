import click
from os import path, listdir
import json
import pandas as pd


@click.group()
@click.option('-d', default='src/locales', help="locales directory path")
@click.option('--filename', default='messages.json', help="locale message filename")
@click.pass_context
def cli(ctx, d: str, filename: str):
    locales_dir = path.realpath(path.join(d))

    dir_items = listdir(locales_dir)
    
    def get_path(p: str):
        msg_path = path.join(locales_dir,p)
        return path.join(msg_path, filename) if path.isdir(msg_path) else msg_path

    items = { path.splitext(i)[0]:get_path(i) for i in dir_items}
    
    ctx.obj['locales_dir'] = locales_dir
    ctx.obj['items'] = items

# extract i18n to csv

@cli.command()
@click.option('-p','--preference', default=['en', 'zh-CN'], multiple=True, help="preference languages")
@click.option('-o', '--output', default='-', help="output")
@click.pass_context
def extract(ctx, preference:list, output:str):
    items = ctx.obj['items']
    msgs = {
        code: json.load(open(items[code], 'r', encoding='utf8'))
        for code in items.keys()
    }
    series_list =[
        pd.json_normalize(v).rename({ 0: k }).transpose()[k]
        for k, v in msgs.items()
    ]
    df = pd.DataFrame(series_list).transpose()
    code_list = [*preference, *[code for code in msgs.keys() if code not in preference]]
    df = df[code_list]

    if output == '-':
        print(df.to_csv())
    else:
        df.to_csv(output)


@cli.command()
@click.option('-t', default='', help='')
@click.option('-i', '--increment', default=True, help='Incremental update')
@click.pass_context
def update(ctx, t: str, increment: bool):
    locales_dir = ctx.obj['locales_dir']
    translated_path = path.realpath(t)

    def merge(d, d2):
        n = {**d}
        for k, v in d2.items():
            n[k] = v if type(v) == str else merge(n[k], v)
        return n
        
    def update_msg(code, content):
        filename = code.replace('_', '-')
        msg_path = path.join(locales_dir, f'{filename}.json')

        try:
            msg = json.load(open(msg_path, 'r', encoding='utf8'))
            data = merge(msg, content) if increment else content
            json.dump(
                data,
                open(msg_path, 'w+', encoding='utf8'),
                ensure_ascii=False,
                indent=2
            )
        except Exception as e:
            print('code: ', code)
            print(e)

    if t.endswith('.jl'):
        with open(translated_path, 'r', encoding='utf8') as f:
            for line in f:
                line_data = json.loads(line)
                code = line_data['code']
                content = line_data['content']
                content = json.loads(content) if type(content) == str else content
                update_msg(code, content)

    if t.endswith('.json'):
        df_dict = json.load(open(translated_path, 'r', encoding='utf8'))
        for code in df_dict:
            update_msg(code, df_dict[code])
    
    if t.endswith('.csv'):
        df = pd.read_csv(translated_path, index_col=0)
        df_dict = df.to_dict(orient='dict')
        data = {}
        for code, d in df_dict.items():
            data[code] = {}
            for k,v in d.items():
                keys = k.split('.')
                current = data[code]
                for i,key in enumerate(keys):
                    if i == len(keys) - 1:
                        current[key] = v
                        pass
                    else:
                        current[key] = current[key] if key in current else {}
                        current = current[key]

        for code in data:
            update_msg(code, data[code])


if __name__ == '__main__':
    cli(obj={})
