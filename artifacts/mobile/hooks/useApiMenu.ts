import { useMenu } from "@/contexts/MenuContext";

/** @deprecated Prefer useMenu() from MenuContext */
export function useApiMenu() {
  const { menuItems, loaded, getItemById } = useMenu();
  return {
    apiItems: [],
    menuItems,
    loaded,
    getItemById,
  };
}
