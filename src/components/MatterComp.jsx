import React, { useRef, useEffect, useState } from 'react';
import Matter from 'matter-js';
import * as Tone from 'tone';

const MatterComp = () => {
  const sceneRef = useRef(null);
  const shapeRef = useRef('CIRCLE');
  const engineRef = useRef(null);
  const [shape, setShape] = useState('CIRCLE');
  const [pause, setPause] = useState(false);
  const [pastGrav, setPastGrav] = useState({
    x: 0.5,
    y: 0.5
  });
  const canvasX = 1000;
  const canvasY = 1000;
  const loopSize = 100;

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

  const Engine = Matter.Engine;
  const Render = Matter.Render;
  const Composite = Matter.Composite;
  const Bodies = Matter.Bodies;
  const Mouse = Matter.Mouse;
  const MouseConstraint = Matter.MouseConstraint;

  const handleClear = () => {
    Composite.clear(engineRef.current.world);
  };

  const handleRadioChange = ({ target }) => {
    shapeRef.current = target.value;
    setShape(target.value);
  };
  const handleUndo = () => {
    engineRef.current.world.bodies.pop();
  };
  const handlePause = () => {
    if (!pause) {
      setPastGrav({
        x: engineRef.current.gravity.x,
        y: engineRef.current.gravity.y
      });
      engineRef.current.gravity.x = 0;
      engineRef.current.gravity.y = 0;
      setPause(true);
    } else {
      engineRef.current.gravity.x = pastGrav.x;
      engineRef.current.gravity.y = pastGrav.y;
      console.log(pastGrav);
      setPause(false);
    }

  };

  useEffect(() => {
    try {
      if (typeof MatterWrap !== 'undefined') {
        // either use by name from plugin registry (Browser global)
        Matter.use('matter-wrap');
      } else {
        // or require and use the plugin directly (Node.js, Webpack etc.)
        Matter.use(require('matter-wrap'));
      }
    } catch (e) {
      // could not require the plugin or install needed
    }
    Tone.start();
    engineRef.current = Engine.create({});
    engineRef.current.gravity.y = 0.5;
    engineRef.current.gravity.x = 0.5;
    const render = Render.create({
      element: sceneRef.current,
      engine: engineRef.current,
      options: {
        width: canvasX,
        height: canvasY,
        wireframes: false,
      },
    });

    // World.add(engine.world, [
    //   // walls
    //   Bodies.rectangle(300, 600, 600, 50, { isStatic: true }),
    //   Bodies.rectangle(0, 300, 50, 600, { isStatic: true }),
    //   Bodies.rectangle(600, 300, 50, 600, { isStatic: true }),
    // ]);

    // add mouse control
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engineRef.current, {
      mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: false,
        },
      },
    });

    Composite.add(engineRef.current.world, mouseConstraint);
    const reverb = new Tone.Reverb(10).toDestination();
    reverb.set({ wet: 0.3 });
    const gainNode = new Tone.Gain(1).connect(reverb);

    Matter.Events.on(mouseConstraint, 'mouseup', () => {
      console.log(
        mouseConstraint.mouse.mouseupPosition.x,
        mouseConstraint.mouse.mouseupPosition.y
      );
      const xPos = mouseConstraint.mouse.mouseupPosition.x;
      const yPos = mouseConstraint.mouse.mouseupPosition.y;
      if (shapeRef.current === 'CIRCLE') {
        const thisBody = Bodies.circle(xPos, yPos, 30, {
          restitution: 0.7,
          frictionAir: 0.1,
          plugin: {
            wrap: {
              min: {
                x: xPos,
                y: yPos,
              },
              max: {
                x: xPos + loopSize,
                y: yPos + loopSize,
              },
            },
          },
        });
        thisBody.synth = new Tone.Synth().connect(gainNode);
        thisBody.synth.silent = true;
        Composite.add(engineRef.current.world, thisBody);
        console.log(engineRef.current);
      }
      if (shapeRef.current === 'SQUARE') {
        const thisBody = Bodies.rectangle(xPos, yPos, 30, 30, {
          restitution: 0.7,
          frictionAir: 0.05,
          plugin: {
            wrap: {
              min: {
                x: 0,
                y: 0,
              },
              max: {
                x: canvasX,
                y: canvasY,
              },
            },
          },
        });
        thisBody.synth = new Tone.Synth().connect(gainNode);
        thisBody.synth.silent = true;
        Composite.add(engineRef.current.world, thisBody);
      }
    });

    // Matter.Events.on(mouseConstraint, 'startdrag', (event) => {
    //   console.log(event);
    // });

    Matter.Runner.run(engineRef.current);
    Render.run(render);

    Matter.Events.on(engineRef.current, 'collisionEnd', (event) => {
      if (event) {
        const bodies = [];
        event.source.pairs.list.forEach(({ bodyA, bodyB }) => {
          if (
            bodyA.synth &&
            !bodies.includes(bodyA.id) &&
            bodyA.speed > 1.5 &&
            bodyA.synth.silent === true
          ) {
            bodyA.synth.volume.value = Math.log(bodyA.speed) - 10;
            bodyA.synth.triggerAttackRelease(
              notes[Math.floor(Math.random() * 14)],
              '16n'
            );
            bodyA.synth.silent = false;
            bodies.push(bodyA.id);
            setTimeout(() => {
              bodyA.synth.silent = true;
            }, 50);
          }
          if (
            bodyB.synth &&
            !bodies.includes(bodyB.id) &&
            bodyB.speed > 1.5 &&
            bodyB.synth.silent === true
          ) {
            bodyB.synth.volume.value = Math.log(bodyB.speed) - 10;
            bodyB.synth.triggerAttackRelease(
              notes[Math.floor(Math.random() * 14)],
              '16n'
            );
            bodyB.synth.silent = false;
            bodies.push(bodyB.id);
            setTimeout(() => {
              bodyB.synth.silent = true;
            }, 50);
          }
        });
      }
    });
  }, []);

  return (
    <>
      <form action="">
        <label htmlFor="circle">
          Circle
          <input
            type="radio"
            className="radio"
            id="circle"
            value="CIRCLE"
            checked={shapeRef.current === 'CIRCLE'}
            onChange={handleRadioChange}
          />
        </label>
        <label htmlFor="square">
          Square
          <input
            type="radio"
            className="radio"
            id="square"
            value="SQUARE"
            checked={shapeRef.current === 'SQUARE'}
            onChange={handleRadioChange}
          />
        </label>
      </form>
      <button onClick={handleClear}>Clear Bodies</button>
      <button onClick={handleUndo}>Undo Add Body</button>
      <button onClick={handlePause}>Pause World</button>
      <div ref={sceneRef} />
    </>
  );
};

export default MatterComp;
