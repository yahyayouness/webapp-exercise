import { SerializedForm } from "./drivers/FormSubmit";
import { IProfile } from "./interfaces";

import { VNode, a, button, div, form, input, label, span } from "@cycle/dom";
import { DOMSource } from "@cycle/dom/xstream-typings";
import { HTTPSource, RequestInput } from "@cycle/http/src/interfaces";
import { prop } from "ramda";
import { Stream } from "xstream";

interface IProps {
  id: string;
  apiUrl: string;
}

interface ISources {
  DOM: DOMSource;
  HTTP: HTTPSource;
  formSubmit: Stream<SerializedForm>;
  props: Stream<IProps>;
}

interface ISinks {
  DOM: Stream<VNode>;
  HTTP: Stream<RequestInput>;
  formSubmit: Stream<Event>;
  router: any;
}

const renderCardAction = () =>
  div(".card-action", [
    a(
      ".cancel.btn.waves-effect.waves-light.deep-orange.m-right",
      "Cancel"
    ),
    button(
      ".btn.waves-effect.waves-light",
      { "attrs": { "type": "submit", "name": "action" } },
      "Submit"
    ),
  ]);

const renderCardContent = ({firstname, lastname, email, phone}) =>
  div(".card-content", [
    span(".card-title", "Contact information"),
    div(".row", [
      div(".input-field.col.s12", [
        input(
          "#title.validate",
          { "attrs": { "name": "firstname", "type": "text", "value": firstname } }
        ),
        label(".active", { "attrs": { "for": "firstname" } }, "First name"),
      ]),
    ]),
    div(".row", [
      div(".input-field.col.s12", [
        input(
          "#last-name.validate",
          { "attrs": { "name": "lastname", "type": "text", "value": lastname } }
        ),
        label(".active", { "attrs": { "for": "lastname" } }, "Last name"),
      ]),
    ]),
    div(".row", [
      div(".input-field.col.s12", [
        input(
          "#email.validate",
          { "attrs": { "name": "email", "type": "text", "value": email } }
        ),
        label(".active", { "attrs": { "for": "email" } }, "Email"),
      ]),
    ]),
    div(".row", [
      div(".input-field.col.s12", [
        input(
          "#phone.validate",
          { "attrs": { "name": "phone", "type": "text", "value": phone } }
        ),
        label(".active", { "attrs": { "for": "phone" } }, "Phone number"),
      ]),
    ]),
  ]);

function renderForm(
  profile$: Stream<IProfile>
): Stream<VNode> {
  return profile$.map((profile) =>
    div(".container", [
      div(".row.movieCardForm", [
        form(
          ".form.card.col.s12.z-depth-3",
          { "attrs": { "action": `/api/peoples/${profile.id}` } },
          [
            renderCardContent(profile),
            renderCardAction(),
          ]
        ),
      ]),
    ])
  );
}

export default function PersonEdit({DOM, HTTP, props, formSubmit}: ISources): ISinks {
  const profile$ = HTTP.select("person-edit").flatten().map(prop("body"));
  const cancelClick$ = DOM.select(".cancel").events("click");
  const formSubmit$ = DOM.select(".form").events("submit");

  // Fetch the API for person profile.
  const personsRequest$ = props.map(({apiUrl, id}) =>
    ({ category: "person-edit", url: `${apiUrl}/${id}` }));

  // Update person data on form submission.
  const submitFormRequest$ = Stream.combine(props, formSubmit)
    .map(([{apiUrl, id}, data]) =>
      ({
        method: "PUT",
        send: data,
        type: "application/json",
        url: `${apiUrl}/${id}`,
      })
    );

  return {
    DOM: renderForm(profile$),
    HTTP: Stream.merge(personsRequest$, submitFormRequest$),
    formSubmit: formSubmit$,
    // Every time we click on cancel, go back in history.
    router: cancelClick$.mapTo(({ type: "goBack" })),
  };
}
