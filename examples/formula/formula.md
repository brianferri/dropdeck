---
dark: true
accent: "#58c4dd"
accent2: "#5cd0b3"
highlight: "#f7d96f"
mono: "JetBrains Mono"
---

➗

# Math and LaTeX, side by side

The same formula, written each way, rendered as one native equation.

---

# The quadratic formula

```math
(-b + sqrt(b^2 - 4*a*c)) / (2*a)
```

```latex
\frac{-b + \sqrt{b^2 - 4 \cdot a \cdot c}}{2 \cdot a}
```

---

# Nested radicals and a continued fraction

```math
sqrt(1 + sqrt(1 + sqrt(1 + x)))
```

```latex
1 + \frac{1}{1 + \frac{1}{1 + \frac{1}{x}}}
```

---

# Subscripts, powers, constants

```math
pi * r_1^2 + 2 * pi * r_2 * h
```

```latex
\pi \cdot r_1^2 + 2 \cdot \pi \cdot r_2 \cdot h
```

---

# Euler's identity

Five constants, one equation.

```math
e^(i*pi) + 1 == 0
```

```latex
e^{i \cdot \pi} + 1 = 0
```

---

# A trigonometric identity

```math
sin(x)^2 + cos(x)^2 == 1
```

```latex
\sin{x}^2 + \cos{x}^2 = 1
```

---

# The law of cosines

```math
c^2 == a^2 + b^2 - 2*a*b*cos(t)
```

```latex
c^2 = a^2 + b^2 - 2 \cdot a \cdot b \cdot \cos{t}
```

---

# A sum with index and limits

Big operators carry their bound variable above and below.

```math
sum(k, 1, n, k^2) == n*(n+1)*(2*n+1) / 6
```

```latex
\sum_{k=1}^{n} k^2 = \frac{n \cdot (n+1) \cdot (2 \cdot n + 1)}{6}
```

---

# The arithmetic mean

A big operator nested inside a fraction.

```math
sum(i, 1, n, x_i) / n
```

```latex
\frac{\sum_{i=1}^{n} x_i}{n}
```

---

# The factorial, as a product

```math
prod(k, 1, n, k)
```

```latex
\prod_{k=1}^{n} k
```

---

# The golden ratio

```math
(1 + sqrt(5)) / 2
```

```latex
\frac{1 + \sqrt{5}}{2}
```

---

# Greek, on both sides

The math notation now spells Greek letters by name, just like LaTeX.

```math
alpha + beta*gamma
```

```latex
\alpha + \beta \cdot \gamma
```

---

# Standard deviation

Greek letters, a subscript, and a sum -- each written both ways.

```math
sigma == sqrt(sum(i, 1, n, (x_i - mu)^2) / n)
```

```latex
\sigma = \sqrt{\frac{\sum_{i=1}^{n} (x_i - \mu)^2}{n}}
```

---

# A phase term

```math
omega_0 * t + phi
```

```latex
\omega_0 \cdot t + \phi
```

---

# A direct sum

Big operators now go beyond sum and product.

```math
bigoplus(i, 1, n, V_i)
```

```latex
\bigoplus_{i=1}^{n} V_i
```

---

# A finite sequence

```math
a_1 + cdots + a_n
```

```latex
a_1 + \cdots + a_n
```

---

# Weight and shape

A directive restyles the group it wraps. `bold`, `italic`, `roman`, `bolditalic` in math map to `\mathbf`, `\mathit`, `\mathrm`, `\boldsymbol` in LaTeX.

```math
bold(a) + italic(b) + roman(c) + bolditalic(d)
```

```latex
\mathbf{a} + \mathit{b} + \mathrm{c} + \boldsymbol{d}
```

---

# Alphabets

The named alphabets: `bb`, `cal`, `frak`, `sans`, `mono` in math; `\mathbb`, `\mathcal`, `\mathfrak`, `\mathsf`, `\mathtt` in LaTeX.

```math
bb(N) + cal(F) + frak(g) + sans(x) + mono(k)
```

```latex
\mathbb{N} + \mathcal{F} + \mathfrak{g} + \mathsf{x} + \mathtt{k}
```

---

# Color

`color(name, expr)` in math, `\textcolor{name}{expr}` in LaTeX -- both color the same group with any CSS color name, and a trailing power stays its own color.

```math
color(red, E) == color(blue, m) * color(green, c)^2
```

```latex
\textcolor{red}{E} = \textcolor{blue}{m} \cdot \textcolor{green}{c}^2
```

---

# Limit placement

Placement is a style too. `limits(...)` / `nolimits(...)` in math, `\limits` / `\nolimits` in LaTeX, stack a big operator's bounds above and below or set them beside -- overriding each operator's default.

```math
limits(int(0, 1, f)) + nolimits(sum(i, 1, n, i))
```

```latex
\int\limits_0^1 f + \sum\nolimits_{i=1}^{n} i
```
