Feature: Edit user

    Scenario: Successfully edit user
        Given I am logged in as "ADMIN"
        And There is the following "user" in the database:
            | name    | surname | email                    | role       |
            | Richard | Blue    | richard.blue@example.com | RESEARCHER |
        When I click "Users" menu link
        And I click "edit" action icon where "Email" is "richard.blue@example.com"
        And I fill "name" with "Mark"
        And I click "Save" button
        Then I should see success message "Profile was successfully updated"
