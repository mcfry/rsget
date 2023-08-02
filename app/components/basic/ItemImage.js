// @flow
import React, { Component } from 'react';
import fetch from 'cross-fetch';
import storage from 'electron-json-storage';
import CircularProgress from '@material-ui/core/CircularProgress';

type Props = {
  id: number,
  name: string
};

class ItemImage extends React.Component {
  constructor(props: Props) {
    super(props);

    this.state = {
      image_url: ''
    };
  }

  getIconImage() {
    const { id, name, icon } = this.props;

    let iconName = '';
    if (icon !== undefined) {
      iconName = icon;
    } else {
      // pots and sets still using name, can change in tracker reducer if need be
      iconName = name + '.png';
    }

    //this.setState({image_url: "https://www.osrsbox.com/osrsbox-db/items-icons/"+id.toString()+".png"});
    this.setState({
      image_url:
        'https://oldschool.runescape.wiki/images/' + iconName.replace(/ /g, '_')
    });

    //async
    // let appdata = storage.getSync(id.toString());
    // if (Object.keys(appdata).length === 0) {
    // 	fetch("http://services.runescape.com/m=itemdb_oldschool/api/catalogue/detail.json?item="+id)
    // 	.then(
    // 		response => response.json(),
    //         error => console.log('An error occurred.', error)
    //     ).then((data) => {
    // 		storage.set(id.toString(), {path: data.item.icon});
    // 		this.setState({image_url: data.item.icon});
    // 	});
    // } else {
    // 	this.setState({image_url: appdata.path});
    // }
  }

  componentDidMount() {
    this.getIconImage();
  }

  render() {
    const { id } = this.props;
    const { image_url } = this.state;

    return (
      <React.Fragment>
        {image_url === '' ? (
          <CircularProgress />
        ) : (
          <a
            target="_blank"
            href={'https://prices.runescape.wiki/osrs/item/' + id.toString()}
          >
            <img src={image_url} alt={id}></img>
          </a>
        )}
      </React.Fragment>
    );
  }
}

export default ItemImage;
