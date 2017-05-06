Project 2
EE 452
Travis Davey
Sohum Bilawal Joshi

The Mouse That Got Away

The project idea was to create 3 objects: A laptop and a mouse, both sitting on a desk.
The  mouse would be the interactive element, that would, through key presses be able to translate across the desk.

To do this, we used models of the objects from 3D Warehouse.

Each object was setup in its own function. Inside these setupObject() functions
the object vertex normals and index information was extracted with a Three.js
OBJLoader. Texture coordinates were collected but were ultimately unused.

The most glaring issue you'll notice is that all objects sharing a single shader program.
An attempt, several actually, was made to create separate vertex/fragment shaders for
all three objects but we ran into issues understanding how to properly deal with
multiple buffers and more than one shader program. 

A breakdown of the rubric:

1) 12 points for creating your scene (realistic, at least 4 polyhedra, at least 3 pieces)
  -3 different objects exist within the scene, sort of. The desk is clearly visible
    given it's large size. The laptop is still located at the origin, a bit too close
    to the desk's leg. The mouse exists in the scene but with all three objects
    on scene together it's pushed out of view and we simply cannot figure out how
    to fix this. A screenshot is included to show the rogue mouse does, in fact, exist.

2) 6 points for user interaction.
  -User interaction works great! Directions can be found on the .html page as well.
  Left Arrow - TranslateX negative <br>
  Right Arrow - TranslateX positive <br>
  Up Arrow - TranslateY positive <br>
  Down Arrow - TranslateY negative <br>
  W - ScaleY positive <br>
  A - ScaleX negative <br>
  S - ScaleY negative <br>
  D - ScaleX positive <br>

3) 12 points for lighting the scene.
  -Two separate lights exist in the scene. Both lights have specular components.
    One is red and one is blue. They do not show up well with the expertly applied
    texture map but a screenshot without the mapping is included to demonstrate.

4) 12 points for texturing the shapes in your scene.
  -Texture mapping was a part both of us struggled with on the assignment. I thought
    I was close enough on Lab5 that I'd have it figured out quickly here. I was wrong.
    A texture is mapped, just not properly.

5) 6 points for the perspective projection.
  -A perspective projection is implemented here the same way it was done in previous labs.
