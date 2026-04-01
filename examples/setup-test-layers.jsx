(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition first.");
        return;
    }

    app.beginUndoGroup("Spline: Create Test Layers");

    var colors = [
        [0.92, 0.26, 0.28],
        [0.98, 0.55, 0.24],
        [0.98, 0.82, 0.24],
        [0.33, 0.79, 0.47],
        [0.26, 0.52, 0.96]
    ];
    var names = ["Red", "Orange", "Yellow", "Green", "Blue"];
    var size = 150;
    var spacing = 200;
    var startX = (comp.width - (colors.length - 1) * spacing) / 2;
    var centerY = comp.height / 2;

    for (var i = 0; i < colors.length; i++) {
        var solid = comp.layers.addSolid(colors[i], names[i], size, size, 1);
        solid.property("Position").setValue([startX + i * spacing, centerY]);
        solid.property("Anchor Point").setValue([size / 2, size / 2]);
    }

    app.endUndoGroup();
    alert("Created " + colors.length + " test layers.");
})();
