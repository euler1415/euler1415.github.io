// Ensure this function is defined within your DOMContentLoaded or accessible globally
// let isRolling = false; // This should be defined in the same scope as doBarrelRoll

function doBarrelRoll() {
    console.log("doBarrelRoll function called.");
    if (isRolling) { // Make sure 'isRolling' is declared in the accessible scope
        console.log("Barrel roll attempted but already in progress.");
        return;
    }

    const body = document.body;
    if (!body) {
        console.error("document.body not found in doBarrelRoll!");
        return;
    }
    console.log("Attempting barrel roll. Current body classes:", body.className);

    isRolling = true;
    body.classList.add('barrel-roll-effect'); // The CSS class from your stylesheet now applies the animation
    console.log("Added 'barrel-roll-effect' class to body. New classes:", body.className);

    setTimeout(() => {
        body.classList.remove('barrel-roll-effect');
        // THIS LINE IS CHANGED:
        body.style.transform = ''; // Clears any inline transform style
        console.log("Removed 'barrel-roll-effect' class and cleared body.style.transform.");

        isRolling = false;
        console.log("Barrel roll sequence finished. isRolling set to false.");
    }, 700); // This duration MUST match the CSS transition-duration (0.7s = 700ms)
}
