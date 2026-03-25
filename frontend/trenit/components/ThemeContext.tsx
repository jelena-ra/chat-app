import { createContext, ReactNode, useContext, useState } from "react";


type Props = {
  children: ReactNode;
};

type ThemeType = {
  dark: boolean;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeType>({
  dark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: Props) {
  const [dark, setDark] = useState(false);

  const toggleTheme = () => setDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ dark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);