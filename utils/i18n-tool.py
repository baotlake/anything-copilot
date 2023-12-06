import click
from os import path
import json


@click.group()
@click.option('--d', default='src/locales', help="locales directory")
@click.pass_context
def cli(ctx, d):
    locales_dir = path.realpath(path.join(d))
    ctx.obj['locales_dir'] = locales_dir


@cli.command()
@click.option('--new', default=['en', 'zh-CN'], multiple=True, help="new language")
@click.option('--old', default='zh-TW', help="old language")
@click.option('--o', default='-', help="output")
@click.pass_context
def extract(ctx, new, old, o=''):
    locales_dir = ctx.obj['locales_dir']
    new_msgs = {
        code: json.load(
            open(path.join(locales_dir, code + '.json'), 'r', encoding='utf8')
        )
        for code in new
    }
    old_msg = json.load(
        open(path.join(locales_dir, old + '.json'), 'r', encoding='utf8')
    )
    new_keys = {
        code: [key for key in new_msgs[code].keys() if key not in old_msg.keys()]
        for code in new
    }
    new_data = {
        code: {key: new_msgs[code][key] for key in new_keys[code]}
        for code in new
    }
    print(json.dumps(new_data, ensure_ascii=False))


@cli.command()
@click.option('--t', default='', help='')
@click.pass_context
def update(ctx, t):
    locales_dir = ctx.obj['locales_dir']
    translated_path = path.realpath(t)

    def update_msg(code, content):
        filename = code.replace('_', '-')
        msg_path = path.join(locales_dir, f'{filename}.json')

        try:
            msg = json.load(open(msg_path, 'r', encoding='utf8'))

            json.dump(
                {
                    **msg,
                    **content,
                },
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
                content = json.loads(content) if type(
                    content) == str else content
                update_msg(code, content)

    if t.endswith('.json'):
        data = json.load(open(translated_path, 'r', encoding='utf8'))
        for code in data:
            update_msg(code, data[code])


if __name__ == '__main__':
    cli(obj={})
