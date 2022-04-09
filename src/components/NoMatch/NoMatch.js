import ErrorPage from "components/ErrorPage";

export default function NoMatch() {
  return (
    <ErrorPage
      message={"The page you are looking for does not exist"}
      title={"Page not found"}
      link={{ path: "/", iconId: "home", text: "Home" }}/>
  );
}
