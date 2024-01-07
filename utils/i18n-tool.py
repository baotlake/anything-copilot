import click
from os import path, listdir
import json



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

# extract updated i18n items

@cli.command()
@click.option('-u','--updated', default=['en', 'zh-CN'], multiple=True, help="updated i18n items")
@click.option('-r', '--ref', default='ja', help="diff reference language")
@click.option('-e','--empty', default=True, help="output empty language")
@click.option('-o', default='-', help="output")
@click.option('-l', default=9999, type=int, help="keys limit")
@click.pass_context
def extract(ctx, updated, ref, empty=True, o='-', l=9999):
    items = ctx.obj['items']

    msgs = {
        code: json.load(open(items[code], 'r', encoding='utf8'))
        for code in items.keys()
    }
    ref_msg = json.load(open(items[ref], 'r', encoding='utf8'))
    new_keys = {
        code: [key for key in msgs[code].keys() if key not in ref_msg.keys()]
        for code in items.keys()
    }

    def get_diff(d, r):
        return { k: d for k in d.keys() if k not in r.keys() }

    new_data = {
        code: {key: msgs[code][key] for key in new_keys[code][0:l]}
        for code in items.keys() if code in updated or (empty and len(new_keys[code]) == 0)
    }

    print(json.dumps(new_data, ensure_ascii=False, indent=4))


@cli.command()
@click.option('-t', default='', help='')
@click.pass_context
def update(ctx, t):
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

            json.dump(
                merge(msg, content),
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
        data = json.load(open(translated_path, 'r', encoding='utf8'))
        for code in data:
            update_msg(code, data[code])


if __name__ == '__main__':
    cli(obj={})
