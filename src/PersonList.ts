import Person from "./Person";
import Collection from "@cycle/collection";
import { VNode, a, div, img, li, nav, span, ul } from "@cycle/dom";
import { DOMSource } from "@cycle/dom/xstream-typings";
import { HTTPSource, RequestInput } from "@cycle/http/src/interfaces";
import { length, map, pipe, prop } from "ramda";
import { Stream } from "xstream";

interface ISources {
  DOM: DOMSource;
  HTTP: HTTPSource;
}

interface ISinks {
  DOM: Stream<VNode>;
  HTTP: Stream<RequestInput>;
}

// A stream containing the hyperscript representation of the navigation.
const navVTree$ = Stream.of(
  nav(".bg-color-primary", [
    div(".nav-wrapper", [
      a({ "attrs": { "href": "/" } }, [
        img(
          ".logo",
          {
            "attrs": {
              "src": "/src/images/logo-people.svg",
              "className": "logo",
            },
          }
        ),
      ]),
      ul(".right.hide-on-med-and-down", [
        li([
          a({ "attrs": { "href": "/" } }, [`Peoples`]),
        ]),
      ]),
    ]),
  ])
);

// A simple function that will output VTree of the # of persons block
const renderNumberOfPersons = (n) =>
  span(".col.s6", `You have ${n} contacts`);

export default function PersonList({HTTP}: ISources): ISinks {
  const personsResponse$ = HTTP.select("persons").flatten();

  const parseResponseToPersons = pipe(
    prop("body"),
    map((profile) => ({ profile: Stream.of(profile) }))
  );

  const persons$ = Collection(
    Person,
    { props: Stream.of({ className: ".col.s6", isDetailed: false }) },
    personsResponse$.map(parseResponseToPersons)
  );

  const personsVTrees$ = Collection.pluck(persons$, prop("DOM"));

  const containerVTree$ = personsVTrees$.map((personsVTrees) =>
    div(".container", [
      div(".header.row", [
        renderNumberOfPersons(length(personsVTrees)),
      ]),
      div(".row", personsVTrees),
    ])
  );

  // Fetch the API for all persons.
  // For now we are firing a single request on app launch.
  const personsRequest$ = Stream.of({
    category: "persons",
    url: "http://localhost:3001/api/peoples",
  });

  return {
    // Combine all views into a single container to render within #app.
    DOM: Stream.combine(
      navVTree$,
      containerVTree$
    ).map(div),
    // Trigger HTTP requests.
    HTTP: personsRequest$,
  };
}
