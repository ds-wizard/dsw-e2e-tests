Feature: Edit user

    Scenario: Successfully edit user
        Given I am logged in as "ADMIN"
        And There is the following "user" in the database:
            | name    | surname | email                    | role       |
            | Richard | Blue    | richard.blue@example.com | RESEARCHER |