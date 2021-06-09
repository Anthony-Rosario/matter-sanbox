import React, { useRef } from 'react';
import Matter from 'matter-js';
Matter.use('matter-collision-events');
import * as Tone from 'tone';

const MatterComp = () => {
  // const [scene, setScene] = useState();
  const sceneRef = useRef(null);
  const notes = [
    'C3',
    'D3',
    'E3',
    'F3',
    'G3',
    'A3',
    'B3',
    'C4',
    'D4',
    'E4',
    'F4',
    'G4',
    'A4',
    'B4',
  ];

  const handleClick = async () => {
    console.log('clicked');
    // const synth = new Tone.Synth().toDestination();
    await Tone.start();
    const Engine = Matter.Engine;
    const Render = Matter.Render;
    const World = Matter.World;
    const Bodies = Matter.Bodies;
    const Mouse = Matter.Mouse;
    const MouseConstraint = Matter.MouseConstraint;

    const engine = Engine.create({});

    const render = Render.create({
      element: sceneRef.current,
      engine,
      options: {
        width: 600,
        height: 600,
        wireframes: false,
      },
    });

    // const ballA = Bodies.circle(210, 100, 30, { restitution: 0.5 });
    // const ballB = Bodies.circle(110, 50, 30, { restitution: 0.5 });
    World.add(engine.world, [
      // walls
      // Bodies.rectangle(200, 0, 600, 50, { isStatic: true }),
      Bodies.rectangle(300, 600, 600, 50, { isStatic: true }),
      Bodies.rectangle(0, 300, 50, 600, { isStatic: true }),
      Bodies.rectangle(600, 300, 50, 600, { isStatic: true }),
    ]);

    // World.add(engine.world, [ballA, ballB]);

    // add mouse control
    const mouse = Mouse.create(render.canvas),
      mouseConstraint = MouseConstraint.create(engine, {
        mouse,
        constraint: {
          stiffness: 0.2,
          render: {
            visible: false,
          },
        },
      });

    World.add(engine.world, mouseConstraint);
    const reverb = new Tone.Reverb(10).toDestination();
    reverb.set({ wet: 0.5 });
    const gainNode = new Tone.Gain(1).connect(reverb);

    Matter.Events.on(mouseConstraint, 'mousedown', (event) => {
      const thisBody = Bodies.circle(150, 50, 30, { restitution: 0.7 });
      // thisBody.onCollide(() => console.log);
      thisBody.synth = new Tone.Synth().connect(gainNode);
      World.add(engine.world, thisBody);
      console.log(thisBody);
    });

    Matter.Runner.run(engine);

    Render.run(render);
    Matter.Events.on(engine, 'collisionEnd', (event) => {
      if (event) {
        const bodies = [];
        event.source.pairs.list.forEach(({ bodyA, bodyB }) => {
          console.log(bodyA.speed, bodyB.speed);
          if (bodyA.synth && !bodies.includes(bodyA) && bodyA.speed > 3) {
            bodyA.synth.volume.value = Math.min(bodyA.speed - 20, -8);
            bodyA.synth.triggerAttackRelease(
              notes[Math.floor(Math.random() * 14)],
              0.1
            );
            bodies.push(bodyA.id);
          }
          if (bodyB.synth && !bodies.includes(bodyB) && bodyB.speed > 3) {
            bodyB.synth.volume.value = Math.min(bodyA.speed - 20, -8);
            bodyB.synth.triggerAttackRelease(
              notes[Math.floor(Math.random() * 14)],
              '0.1'
            );
            bodies.push(bodyB.id);
          }
        });
        // const a = event.source.pairs.list[0].bodyA.label;
        // // let b = event.source.pairs.list[0].bodyB.label
        // const synth = new Tone.Synth().toDestination();
        // if(a) synth.triggerAttackRelease('C4', '4n');
        // // if(b)synth.triggerAttackRelease('F4', '4n');
        // console.log('a', a);
      }
      // let b = event.pairs[1] ? event.pairs[1] : null;
      // let b = event.pairs[1] ? event.pairs[1] : null

      // check bodies, do whatever...
    });
  };

  return (
    <>
      <button onClick={handleClick}>start synth</button>
      <div ref={sceneRef} />
    </>
  );
};

export default MatterComp;
