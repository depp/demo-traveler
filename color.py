import re
import sys

def die(*msg):
    print('Error:', *msg, file=sys.stderr)
    raise SystemExit(1)

HEXCOLOR = re.compile(r'#?([A-Fa-f0-9]+)')

def parse_color(c):
    m = HEXCOLOR.fullmatch(c)
    if not m:
        die('Not a color:', repr(c))
    digits = m.group(1)
    if len(digits) == 3 or len(digits) == 4:
        return [int(digits[i:i+1], 16) / 15 for i in range(3)]
    if len(digits) == 6 or len(digits) == 8:
        return [int(digits[i:i+2], 16) / 255 for i in range(0, 6, 2)]
    die('Invalid length:', repr(c))

def print_color(c):
    c = [max(1,min(9,round(1+x*8))) for x in c]
    rgb = [max(0,min(255,round((x - 1) * 32))) for x in c]
    print('{0[0]}{0[1]}{0[2]}: [\x1b[48;2;{1[0]};{1[1]};{1[2]}m     \x1b[0m]'
          .format(c, rgb))

def main(argv):
    if not argv:
        die('Usage: color.py <color>...')
    for arg in argv:
        c = parse_color(arg)
        print_color(c)

if __name__ == '__main__':
    main(sys.argv[1:])
