import type { CartItem, Persona } from "@acme/shared";

export function makePersona(overrides: Partial<Persona> = {}): Persona {
  return {
    id: "test-persona",
    name: "Review Assistant",
    tagline: "A second pair of eyes for your code",
    description: "Reviews code and explains suggested improvements.",
    avatarUrl: "/test-avatar.svg",
    specialty: "Engineering",
    capabilities: ["Code review", "Documentation", "Refactoring"],
    price: 49.99,
    rating: 4.5,
    reviewCount: 12,
    tier: "Pro",
    ...overrides,
  };
}

export function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  const persona = overrides.persona ?? makePersona();
  return {
    id: "test-cart-item",
    personaId: persona.id,
    persona,
    quantity: 2,
    ...overrides,
  };
}
