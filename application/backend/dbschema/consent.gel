module consent {

    # a consent is a collection of statements of permissions that apply to any shareable entity

    type Consent {

        # statements are a single enforceable unit of rules
        #

        multi link statements -> ConsentStatement {
            on source delete delete target;
            on target delete allow;
            constraint exclusive;
        };

    }

    abstract type ConsentStatement {

    }

    type ConsentStatementDuo extending ConsentStatement {

        required property dataUseLimitation -> json;

    }

}
