import LevelButton from './levelbutton';

export default {
  functional: true,

  props: {
    currentLevelNumber: { type: Number, required: true },
    levelCount: { type: Number, required: true },
    loadLevel: { type: Function, required: true },
  },

  render (createElement, { props }) {
    const { currentLevelNumber, levelCount, loadLevel } = props;

    // http://stackoverflow.com/a/20066663
    const levelNumbers = Array
      .apply(null, { length: levelCount })
      .map(Number.call, Number);

    const levelButtons = levelNumbers.map(levelNumber =>
      createElement(LevelButton, {
        props: { currentLevelNumber, levelNumber, loadLevel },
      })
    );

    return createElement('nav', levelButtons);
  },
};
