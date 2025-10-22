# Celestial Body Textures

This folder should contain equirectangular texture maps for all celestial bodies.

## Required Textures (2K resolution, JPG format):

- `sun.jpg` - Sun photosphere texture
- `mercury.jpg` - Mercury surface texture
- `venus.jpg` - Venus surface texture
- `earth.jpg` - Earth diffuse map (no lighting)
- `mars.jpg` - Mars surface texture
- `jupiter.jpg` - Jupiter bands texture
- `saturn.jpg` - Saturn surface texture
- `uranus.jpg` - Uranus texture
- `neptune.jpg` - Neptune texture

## Optional Textures:

- `earth_normal.jpg` - Earth normal map for surface detail
- `earth_clouds.png` - Earth cloud layer (with alpha)
- `saturn_rings.png` - Saturn rings texture (with alpha)
- `pluto.jpg` - Pluto surface texture

## Search Terms for Finding Textures:

Use these exact search phrases:
- `equirectangular planet texture map jpg 2k`
- `sun photosphere texture equirectangular jpg`
- `earth diffuse map equirectangular jpg no lighting`
- `earth normal map equirectangular jpg`
- `earth clouds alpha png equirectangular`
- `mars surface texture equirectangular jpg`
- `jupiter texture bands equirectangular jpg`
- `saturn texture equirectangular jpg`
- `saturn rings texture png alpha`
- `uranus texture equirectangular jpg`
- `neptune texture equirectangular jpg`

## Texture Requirements:

- **Format**: JPG for surfaces, PNG with alpha for rings/clouds
- **Resolution**: 2K (2048x1024 or 2048x2048) minimum
- **Projection**: Must be equirectangular (rectangular world map)
- **Content**: No baked-in shadows or highlights (flat albedo)
- **File Size**: ≤ 2-4 MB each

## Testing:

The system will gracefully fall back to procedural materials if textures are not found. No errors will occur - planets will just use their base colors until textures are added.
