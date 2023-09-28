[Live Demo Here](https://liunicholas6.github.io/hw01-fireball/)

I wanted the fireball to look like it was moving, so I started by applying a sine function
![Sine](videos/sine.gif)

To make it look like there are some actual flames, I added some quintic smoothed FBM
![FBM](videos/fbm.gif)


Then I used a lerp on a step function on radius to get a cell-shading effect
![Cellshade](videos/cellshade.gif)

The upper and lower ends of the range were getting cut off, so I added some bias and gain functions to tweak the color bins and the palette
![Bias](videos/bias.gif)

I didn't like that the center of the ball just looks like a yellow ball. So I lerped with perlin noise on the lowest bar of the histogram.
![Perlin](videos/perlin.gif)

Finally, for some contrast I put in a simple background.
![Background](videos/background.gif)
