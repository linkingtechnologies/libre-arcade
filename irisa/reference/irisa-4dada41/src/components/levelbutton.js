export default {
  functional: true,

  props: {
    currentLevelNumber: { type: Number, required: true },
    levelNumber: { type: Number, required: true },
    loadLevel: { type: Function, required: true },
  },

  render (createElement, { props }) {
    const { currentLevelNumber, levelNumber, loadLevel } = props;

    return createElement('button', {
      'class': {
        complete: levelNumber < currentLevelNumber,
        current: levelNumber === currentLevelNumber,
      },
      'on': {
        click: () => {
          const isDevMode = localStorage.getItem('dev') === 'true';
          const canLoad = levelNumber <= currentLevelNumber || isDevMode;

          if (!canLoad) {
            return;
          }

          loadLevel(levelNumber);
        }
      },
    }, levelNumber);
  },
};
