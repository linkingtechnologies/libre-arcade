import Entity from './entity';

export default {
  functional: true,

  props: {
    boardSize: { type: Number, required: true },
    entities: { type: Array, required: true },
  },

  render (createElement, { props }) {
    const { boardSize, entities } = props;

    const entityElements = entities.map(entity => createElement(Entity, {
      props: { boardSize, ...entity.props },
    }));

    return createElement('main', entityElements);
  },
};

