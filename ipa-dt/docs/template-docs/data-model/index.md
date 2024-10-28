---
title: Overview
sidebar_position: 2
---
The Digital Twin Data Model is composed of collections of data and the relationships between data in those collections.

## Collections

Each collection contains data of the same type. So an Asset collection contains only Asset data and a Space Collection contains only Space data. All data in a collection is also of the same form and follows the same schema.

There are different types of collections in the Digital Twin. Most collections contain Entity data which describe a Digital Twin Entity Type like an Asset, a Space, or a BMS Equipment. Some collections contain reference data used to classify or define attribute values on Entities, such as File Attributes or the Type Map to classify model elements and Assets.

## Relationships

Data in a collection can be related to other data of the same or different collections. These explicit relations between data elements, not keys and foreign keys between tables. A data elements is directly related to another data element. A data element can be related to none, one, or many other data elements across any number of other collections.

Relations are directional, specifying Parent and Child. Relations can be traversed in queries in either direction though, by optionally specifying “\_isInverse: true” to query a Child to Parent relation.

An Asset for instance can have parent relations to Model Elements, FIles, and BMS Equipment and a child relation to an Asset Collection.

## Digital Twin Entity Schema

Data in collections can be stored in the format that makes sense for the specific type of data, especially if the data is coming in from an outside source and the data is best kept in its original form.

However, many of the data types we create follow the Entity schema and/or many data types that do not, end up being represented as Entities in the UI. The Entity schema is a simple way of display a “thing” and “properties” on those things and allowing for interaction with them.

The Entity schema is currently composed of only two things:

1. An Entity Name
2. An array of Properties on the Entity

The Entity Name is just a String value of what the specific Entity Instance should be called. The Asset’s name for instance if the Entity represents an Asset.

The array of properties can be none, one, or more properties on the Entity, that follow the Property schema.

It is important to remember, that the data can store in any fashion. It just needs to be transformed into an Entity when being used in the UI and transformed back to it’s original form when being changed.

## A Schema-less Platform

It is important to remember that the Platform is schema-less. This gives us a ton of flexibility in storing, relating, managing, and displaying data. The Digital Twin lays down its own schema on top of the schema-less platform. That schema is the responsibility of the application to enforce, however. The Platform has no concept of any of the Digital Twin Entity Types.

_So when editing an entity, you must be sure you supply the whole entity in its original form to the Platform._

You can’t simply send an Asset with one edited property back to the server. You’ll lose all other properties. You can’t send the Entity representation of a BMS Equipment back to the server as it will overwrite or remove all the other BMS Equipment data on it.

## With Great Power

The Platform and the Digital Twin Entity Data Model allow for flexibility, customization, and quick implementation of new Entity Types and Features. However, with that great power comes a great responsibility to make sure you know your data and persisting it correctly in the Platform.
