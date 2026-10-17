import math
P = [('Sand', '#F4EBDD'), ('Dune', '#E3D2B6'), ('Poppy', '#E8622A'), ('Gold', '#F3B252'), ('Sage', '#8FA382'), ('Sage deep', '#4F6248'),
     ('Sky', '#9CC3E2'), ('Fjord', '#2F5D8A'), ('Ink', '#1C1A17'), ('Night', '#0C1A2B'), ('Night 2', '#13263C'), ('Moon', '#E9E4D6'), ('Lamp', '#F5B860')]
def lin(c):
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
for n, h in P:
    r, g, b = (lin(int(h[i:i + 2], 16)) for i in (1, 3, 5))
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l, m, s = (x ** (1 / 3) for x in (l, m, s))
    L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s
    A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s
    B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    C = math.hypot(A, B); H = math.degrees(math.atan2(B, A)) % 360
    print(f"{n}|{h}|oklch({L*100:.1f}% {C:.3f} {H:.1f})")
