import React, { useState, useEffect } from "react";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Grid from "@material-ui/core/Grid";
import { Link, useHistory } from "react-router-dom";
import PropTypes from "prop-types";
import Modal from "../Modal";
import Button from "../Button";
import styled from "styled-components";
import { FONTS, COLORS } from "../../constants";
import SignUp from "../SignUp2";
import MobileNav from "./MobileNav";

import useAuth, { AUTH_STATES } from "../../providers/AuthProvider";

const TextThemes = {
  fontSize: {
    default: "max(16px,1vw)",
    lg: "max(24px,1.2vw)",
  },
  fontWeight: {
    default: "400",
    lg: "700",
  },
};

const LinkStyled = styled(Link)`
  font-family: ${FONTS.font1};
  font-color: ${COLORS.blue};
  padding-right: 40px;
  font-size: ${(props) => TextThemes.fontSize[props.ver]};
  font-weight: ${(props) => TextThemes.fontWeight[props.ver]};
  text-decoration: none;
  &:link {
    color: ${COLORS.blue};
  }
  &:visited {
    color: ${COLORS.blue};
  }
  &:hover {
    color: ${COLORS.yellow};
    text-decoration: none;
  }
  &:active {
    color: ${COLORS.yellow};
    text-decoration: none;
  }
`;

const UserLinkWrapper = styled.div`
  margin-left: auto;
  flex-direction: row;
  display: flex;
`;

export default function NavBar(props) {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const { authState, signout } = useAuth();
  const history = useHistory();

  const loggedOutUserLinks = (
    <>
      <Button theme="primary" size="sm" onClick={() => history.push("/signin")}>
        {" "}
        Login{" "}
      </Button>
      <Modal
        title="Sign Up"
        trigger={
          <Button theme="accent" size="sm">
            {" "}
            Sign Up{" "}
          </Button>
        }
      >
        <SignUp />
      </Modal>
    </>
  );

  const loggedInUserLinks = (
    // TODO there is a bug in the dashboard when trying to navigate to /dashboard
    <>
      <Link to="/dashboard/profile">
        {" "}
        <Button theme="accent" size="sm">
          Dashboard
        </Button>
      </Link>
      <Button theme="primary" size="sm" onClick={signout}>
        {" "}
        Sign Out{" "}
      </Button>
    </>
  );

  useEffect(() => {
    const updateWindowWidth = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", updateWindowWidth);

    return () => {
      window.removeEventListener("resize", updateWindowWidth);
    };
  }, []);

  if (windowWidth < 1024) {
    return (
      <MobileNav
        links={props.links}
        loggedIn={authState === AUTH_STATES.LOGGED_IN}
      />
    );
  }
  return (
    <>
      <AppBar
        color="default"
        flex-direction="row"
        position={props.position}
        elevation={0}
      >
        <Toolbar>
          <Grid>
            <LinkStyled to="/" ver="lg">
              CovEd
            </LinkStyled>
            {props.links.map((link) => (
              <LinkStyled key={link.link} to={link.link} ver="default">
                {link.title}
              </LinkStyled>
            ))}
          </Grid>
          <UserLinkWrapper>
            {authState === AUTH_STATES.LOGGED_IN
              ? loggedInUserLinks
              : loggedOutUserLinks}
          </UserLinkWrapper>
        </Toolbar>
      </AppBar>
    </>
  );
}

NavBar.propTypes = {
  links: PropTypes.array,
  position: PropTypes.string,
  ver: PropTypes.string,
};

NavBar.defaultProps = {
  links: [
    {
      title: "Resources",
      link: "/resources",
    },
    {
      title: "Programs",
      link: "/programs",
    },
    {
      title: "FAQs",
      link: "/faqs",
    },
    {
      title: "Meet Our Team",
      link: "/team",
    },
    {
      title: "Contact Us",
      link: "/contactus",
    },
  ],
  position: "sticky",
  ver: "default",
};
