"""Generador/validador inicial para Sudoproyective.

Produce puzzles a partir de una solución completa, retira pistas y conserva sólo
configuraciones con solución única. Este script es deliberadamente independiente
de la UI para que el motor de generación pueda evolucionar por separado.
"""
from __future__ import annotations

from random import Random

N = 7
CELLS = [(r, c) for r in range(N) for c in range(N)]
SYMBOLS = set(range(1, N + 1))


def mod(n: int) -> int:
    return n % N


def units_for_slopes(slopes=(1,)):
    units = []
    units += [[(r, c) for c in range(N)] for r in range(N)]
    units += [[(r, c) for r in range(N)] for c in range(N)]
    for m in slopes:
        units += [[(mod(m * c + b), c) for c in range(N)] for b in range(N)]
    return units


def peer_map(slopes=(1,)):
    units = units_for_slopes(slopes)
    memberships = {cell: [u for u in units if cell in u] for cell in CELLS}
    return {
        cell: set().union(*memberships[cell]) - {cell}
        for cell in CELLS
    }


def affine_solution(a=1, c=1, d=0):
    """S(x,y)=a*x+c*y+d over F_7, translated to symbols 1..7."""
    return [[mod(a * col + c * row + d) + 1 for col in range(N)] for row in range(N)]


def candidates(grid, cell, peers):
    r, c = cell
    used = {grid[rr][cc] for rr, cc in peers[cell] if grid[rr][cc]}
    return SYMBOLS - used


def count_solutions(grid, slopes=(1,), limit=2):
    peers = peer_map(slopes)
    work = [row[:] for row in grid]
    count = 0

    def search():
        nonlocal count
        if count >= limit:
            return
        best = None
        best_candidates = None
        for cell in CELLS:
            r, c = cell
            if work[r][c] == 0:
                cand = candidates(work, cell, peers)
                if not cand:
                    return
                if best_candidates is None or len(cand) < len(best_candidates):
                    best, best_candidates = cell, cand
        if best is None:
            count += 1
            return
        r, c = best
        for value in sorted(best_candidates):
            work[r][c] = value
            search()
            work[r][c] = 0
            if count >= limit:
                return

    search()
    return count


def make_puzzle(solution, target_givens=30, seed=0, slopes=(1,)):
    rng = Random(seed)
    puzzle = [row[:] for row in solution]
    order = CELLS[:]
    rng.shuffle(order)
    for r, c in order:
        if sum(v != 0 for row in puzzle for v in row) <= target_givens:
            break
        old = puzzle[r][c]
        puzzle[r][c] = 0
        if count_solutions(puzzle, slopes=slopes, limit=2) != 1:
            puzzle[r][c] = old
    return puzzle


if __name__ == '__main__':
    solution = affine_solution()
    puzzle = make_puzzle(solution, target_givens=30, seed=7)
    print('Soluciones:', count_solutions(puzzle))
    for row in puzzle:
        print(row)
