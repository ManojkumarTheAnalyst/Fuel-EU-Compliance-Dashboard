export function totalEnergyMj(route) {
    return route.lifts.reduce((s, l) => s + l.energyMj, 0);
}
/** Weighted average well-to-wake intensity (gCO₂e/MJ). */
export function calculateGHGIntensity(route) {
    const energy = totalEnergyMj(route);
    if (energy <= 0)
        return 0;
    const weighted = route.lifts.reduce((s, l) => s + l.energyMj * l.ghgIntensityGco2ePerMj, 0);
    return weighted / energy;
}
//# sourceMappingURL=ghg-intensity.js.map