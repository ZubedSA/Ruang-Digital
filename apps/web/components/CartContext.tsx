'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CartItemStorage {
  productId: string;
  variantId?: string | null;
  name: string;
  slug: string;
  price: number;
  image: string;
  type: 'DIGITAL' | 'PHYSICAL';
  quantity: number;
}

interface CartContextType {
  items: CartItemStorage[];
  itemCount: number;
  addItem: (item: CartItemStorage) => void;
  updateQuantity: (productId: string, variantId: string | null | undefined, quantity: number) => void;
  removeItem: (productId: string, variantId: string | null | undefined) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemStorage[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rd_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load cart from storage', e);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem('rd_cart', JSON.stringify(items));
      } catch (e) {
        console.error('Failed to save cart to storage', e);
      }
    }
  }, [items, mounted]);

  const addItem = (newItem: CartItemStorage) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (it) => it.productId === newItem.productId && (it.variantId || null) === (newItem.variantId || null)
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += newItem.quantity;
        return updated;
      }
      return [...prev, newItem];
    });
  };

  const updateQuantity = (productId: string, variantId: string | null | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }
    setItems((prev) =>
      prev.map((it) => {
        if (it.productId === productId && (it.variantId || null) === (variantId || null)) {
          return { ...it, quantity };
        }
        return it;
      })
    );
  };

  const removeItem = (productId: string, variantId: string | null | undefined) => {
    setItems((prev) =>
      prev.filter(
        (it) => !(it.productId === productId && (it.variantId || null) === (variantId || null))
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((acc, it) => acc + it.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
