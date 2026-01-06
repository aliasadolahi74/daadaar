"use client";

import React, { createContext, useContext, useCallback } from "react";

const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/**
 * Convert English digits to Persian digits
 */
export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}

/**
 * Convert Persian digits to English digits
 */
export function toEnglishDigits(value: string): string {
  return value.replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)));
}

// Context for Persian number conversion
const PersianNumberContext = createContext<{
  toPersian: (value: string | number) => string;
  toEnglish: (value: string) => string;
}>({
  toPersian: toPersianDigits,
  toEnglish: toEnglishDigits,
});

export function usePersianNumbers() {
  return useContext(PersianNumberContext);
}

interface PersianNumberProviderProps {
  children: React.ReactNode;
}

export function PersianNumberProvider({ children }: PersianNumberProviderProps) {
  const toPersian = useCallback((value: string | number) => toPersianDigits(value), []);
  const toEnglish = useCallback((value: string) => toEnglishDigits(value), []);

  return (
    <PersianNumberContext.Provider value={{ toPersian, toEnglish }}>
      {children}
    </PersianNumberContext.Provider>
  );
}

/**
 * Component that renders text with Persian digits
 */
interface PersianTextProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

export function PersianText({ children, as: Component = "span", className }: PersianTextProps) {
  const convertChildren = (node: React.ReactNode): React.ReactNode => {
    if (typeof node === "string") {
      return toPersianDigits(node);
    }
    if (typeof node === "number") {
      return toPersianDigits(node);
    }
    if (Array.isArray(node)) {
      return node.map((child, index) => (
        <React.Fragment key={index}>{convertChildren(child)}</React.Fragment>
      ));
    }
    if (React.isValidElement(node)) {
      return React.cloneElement(node, {
        ...node.props,
        children: convertChildren(node.props.children),
      });
    }
    return node;
  };

  return <Component className={className}>{convertChildren(children)}</Component>;
}

/**
 * HOC to wrap a component and convert all text content to Persian digits
 */
export function withPersianNumbers<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P> {
  const WithPersianNumbers: React.FC<P> = (props) => {
    return (
      <PersianText as="div">
        <WrappedComponent {...props} />
      </PersianText>
    );
  };

  WithPersianNumbers.displayName = `WithPersianNumbers(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return WithPersianNumbers;
}
