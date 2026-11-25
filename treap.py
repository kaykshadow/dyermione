"""
treap.py — Treap (Tree + Heap) em Python

Cada nó possui:
  - key:      chave de busca (regra de BST)
  - priority: prioridade aleatória (regra de Heap)

Convenção usada: MIN-HEAP (a menor prioridade fica mais perto da raiz).
Para usar MAX-HEAP, basta trocar `a < b` por `a > b` na função better().

Executar: python treap.py
"""

import random


class Node:
    __slots__ = ("key", "priority", "left", "right")

    def __init__(self, key, priority=None):
        self.key = key
        self.priority = random.randint(1, 999) if priority is None else priority
        self.left = None
        self.right = None


def better(a, b):
    """True se a prioridade `a` deve ficar ACIMA de `b`.
    Min-Heap: a < b   |   Max-Heap: a > b"""
    return a < b


def rotate_right(y):         
    x = y.left
    y.left = x.right
    x.right = y
    return x


def rotate_left(x):
    y = x.right
    x.right = y.left
    y.left = x
    return y

def search(node, key):
    while node is not None:
        if key == node.key:
            return node
        node = node.left if key < node.key else node.right
    return None


def insert(node, key, priority=None):
    if node is None:
        return Node(key, priority)
    if key == node.key:
        return node                                  # ignora repetidas

    if key < node.key:
        node.left = insert(node.left, key, priority)
        if better(node.left.priority, node.priority):
            node = rotate_right(node)
    else:
        node.right = insert(node.right, key, priority)
        if better(node.right.priority, node.priority):
            node = rotate_left(node)
    return node

def remove(node, key):
    if node is None:
        return None

    if key < node.key:
        node.left = remove(node.left, key)
    elif key > node.key:
        node.right = remove(node.right, key)
    else:
        if node.left is None:                        # 0 ou 1 filho
            return node.right
        if node.right is None:
            return node.left
        if better(node.left.priority, node.right.priority):
            node = rotate_right(node)
            node.right = remove(node.right, key)
        else:
            node = rotate_left(node)
            node.left = remove(node.left, key)
    return node

def split(node, key):
    if node is None:
        return None, None
    if node.key <= key:
        left, right = split(node.right, key)
        node.right = left
        return node, right
    left, right = split(node.left, key)
    node.left = right
    return left, node

def merge(a, b):
    if a is None:
        return b
    if b is None:
        return a
    if better(a.priority, b.priority):
        a.right = merge(a.right, b)
        return a
    b.left = merge(a, b.left)
    return b

def is_valid(node, lo=float("-inf"), hi=float("inf")):
    if node is None:
        return True
    if not (lo < node.key < hi):
        return False
    for child in (node.left, node.right):
        if child is not None and better(child.priority, node.priority):
            return False
    return is_valid(node.left, lo, node.key) and is_valid(node.right, node.key, hi)


def inorder(node):
    if node is not None:
        yield from inorder(node.left)
        yield node.key
        yield from inorder(node.right)


def print_tree(node, depth=0):
    """Desenha a árvore 'deitada': a raiz fica à esquerda."""
    if node is None:
        return
    print_tree(node.right, depth + 1)
    print(" " * (depth * 6) + f"{node.key} (p={node.priority})")
    print_tree(node.left, depth + 1)


if __name__ == "__main__":
    root = None
    for k in (10, 20, 30, 40, 50, 60, 70, 80):
        root = insert(root, k)

    print("Treap (raiz à esquerda):")
    print_tree(root)
    print("\nEm ordem:", *inorder(root))
    print("Treap válida?", "sim" if is_valid(root) else "não")

    print("\nBusca por 40:", "encontrado" if search(root, 40) else "não encontrado")

    root = remove(root, 40)
    print("Após remover 40:", *inorder(root))

    # Intervalo [20, 60] com Split/Merge (exemplo da página)
    left, right = split(root, 60)        # left: <= 60 | right: > 60
    left, mid = split(left, 19)          # left: <= 19 | mid: 20..60
    print("Intervalo [20, 60]:", *inorder(mid))

    root = merge(merge(left, mid), right)
    print("Após Merge:", *inorder(root))
