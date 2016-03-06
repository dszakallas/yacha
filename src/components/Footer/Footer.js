import React, { Component } from 'react'
import withStyles from '../../decorators/withStyles'
import styles from './Footer.less'

@withStyles(styles)
class Footer extends Component {

  render () {
    return (
      <footer>
        <p>&copy; Yacha 2015</p>
      </footer>
    )
  }
}

export default Footer
