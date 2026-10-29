import type { Skin } from './types';
import metropolregionNuernberg from './metropolregion-nuernberg';

export type { Skin, SkinLogo } from './types';

const skins: Skin[] = [metropolregionNuernberg];

const byId = new Map(skins.map((s) => [s.id, s]));

/** Resolve a skin id from a URL param; unknown or empty ids fall back to null (default look). */
export function getSkin(id: string | null | undefined): Skin | null {
	if (!id) return null;
	return byId.get(id.trim().toLowerCase()) ?? null;
}

export function listSkins(): Pick<Skin, 'id' | 'label'>[] {
	return skins.map(({ id, label }) => ({ id, label }));
}

/** Inline CSS custom properties consumed by `.kd-skin` rules in app.css and Card.svelte. */
export function skinStyle(skin: Skin): string {
	const vars: Record<string, string | undefined> = {
		'--kd-font-body': skin.fonts?.body,
		'--kd-font-heading': skin.fonts?.heading,
		'--kd-heading-transform': skin.fonts?.headingTransform,
		'--kd-accent': skin.colors?.accent,
		'--kd-accent-dark': skin.colors?.accentDark
	};
	return Object.entries(vars)
		.filter(([, v]) => v)
		.map(([k, v]) => `${k}: ${v}`)
		.join('; ');
}
