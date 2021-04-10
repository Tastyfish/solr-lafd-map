from PIL import Image
from os import makedirs

minZ = 2
maxZ = 6

def saveTile(tile, z, x, y):
    makedirs('../tiles/{z}/{x}'.format(x = x, z = z), exist_ok = True)
    tile.resize((256, 256)).save('../tiles/{z}/{x}/{y}.png'.format(x = x, y = y, z = z), 'png')

# Save and further break down the given tile, given the current z, x, and y
def cascadeTile(tile, z, x, y):
    saveTile(tile, z, x, y)

    # only split up if there's more Z levels to go
    if z < maxZ:
        subtileW = tile.width / 2
        subtileH = tile.height / 2
        cascadeTile(tile.crop((0, 0, subtileW, subtileH)), z + 1, x * 2, y * 2)
        cascadeTile(tile.crop((subtileW, 0, tile.width, subtileH)), z + 1, x * 2 + 1, y * 2)
        cascadeTile(tile.crop((0, subtileH, subtileW, tile.height)), z + 1, x * 2, y * 2 + 1)
        cascadeTile(tile.crop((subtileW, subtileH, tile.width, tile.height)), z + 1, x * 2 + 1, y * 2 + 1)

# Bootstrap with the built in images
for x in range(2):
    for y in range(3):
        with Image.open('./original/minimap_{y}_{x}.png'.format(x = x, y = y)) as tile:
            print('Will do {x},{y},{z}'.format(x = x, y = y, z = minZ))
            cascadeTile(tile, minZ, x, y)
